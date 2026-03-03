import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';
import { StripeService } from '../stripe/stripe.service';
import { ProjectProgressService } from '../projects/project-progress.service';
import { CreateInvoiceDto, InvoiceStatus } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly projectProgress: ProjectProgressService) {}

  private async ensureInvoicesBucket() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === 'invoices');
    if (!exists) {
      await supabase.storage.createBucket('invoices', { public: false });
    }
  }


  async findAll(
    userId: string,
    page: number,
    limit: number,
    status?: string,
  ) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return data;
  }

  private async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();

    // Count all invoices for this user this year (more reliable than ilike)
    const { count, error } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${year}-01-01T00:00:00.000Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);

    if (error) {
      // Fallback: use timestamp to guarantee uniqueness
      return `FAC-${year}-${Date.now().toString().slice(-6)}`;
    }

    const seq = (count ?? 0) + 1;
    return `FAC-${year}-${String(seq).padStart(3, '0')}`;
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    const { items, ...invoiceHeader } = dto;

    // Calcul du total
    const total_amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );

    let invoice_number = await this.generateInvoiceNumber(userId);

    // Insertion de la facture (avec retry sur contrainte UNIQUE)
    let insertedId: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceHeader,
          user_id: userId,
          total_amount,
          subtotal: total_amount,
          invoice_number,
          title: invoice_number,          // title est NOT NULL sans default
          status: invoiceHeader.status ?? InvoiceStatus.DRAFT,
        })
        .select('id')
        .single();

      if (!invoiceError && data) {
        insertedId = data.id as string;
        break;
      }

      // Conflit de numéro unique → on utilise un suffixe temporel
      if ((invoiceError as { code?: string }).code === '23505' && attempt < 2) {
        const year = new Date().getFullYear();
        invoice_number = `FAC-${year}-${Date.now().toString().slice(-5)}`;
        continue;
      }

      const msg = (invoiceError as { message?: string })?.message ?? 'Erreur DB';
      throw new InternalServerErrorException(`Facture: ${msg}`);
    }

    if (!insertedId) throw new InternalServerErrorException('Impossible de créer la facture');

    // Insertion des lignes
    const invoiceItems = items.map((item) => ({
      ...item,
      invoice_id: insertedId,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback manuel : suppression de la facture orpheline
      await supabase.from('invoices').delete().eq('id', insertedId);
      const msg = (itemsError as { message?: string })?.message ?? 'Erreur DB lignes';
      throw new InternalServerErrorException(`Lignes: ${msg}`);
    }

    const created = await this.findOne(insertedId, userId);
    // Recalcul progression si la facture est liée à un projet
    if (created?.project_id) {
      void this.projectProgress.recalculate(created.project_id as string);
    }
    return created;
  }

  async update(id: string, userId: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(id, userId);

    const { data, error } = await supabase
      .from('invoices')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (existing?.project_id) {
      void this.projectProgress.recalculate(existing.project_id as string);
    }
    return data;
  }

  async remove(id: string, userId: string) {
    const invoice = await this.findOne(id, userId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft invoices can be deleted',
      );
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async uploadPdf(id: string, userId: string, pdfBuffer: Buffer) {
    await this.findOne(id, userId);
    await this.ensureInvoicesBucket();

    const path = `${userId}/${id}.pdf`;

    const { error: storageError } = await supabase.storage
      .from('invoices')
      .upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (storageError) {
      throw new InternalServerErrorException(
        `Erreur upload PDF : ${storageError.message}`,
      );
    }

    const { error: dbError } = await supabase
      .from('invoices')
      .update({
        pdf_url: path,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (dbError) {
      const msg = (dbError as { message?: string })?.message ?? 'DB update error';
      throw new InternalServerErrorException(`PDF DB update: ${msg}`);
    }

    return { success: true };
  }

  async getPdfSignedUrl(id: string, userId: string) {
    const invoice = await this.findOne(id, userId);

    if (!invoice.pdf_url) {
      throw new NotFoundException('Aucun PDF généré pour cette facture');
    }

    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(invoice.pdf_url as string, 3600);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        "Impossible de générer l'URL du PDF",
      );
    }

    return { signedUrl: data.signedUrl };
  }

  async createPaymentIntent(id: string, userId: string, stripeService: StripeService) {
    const invoice = await this.findOne(id, userId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    const paymentIntent = await stripeService.createPaymentIntent(
      invoice.total_amount,
      'eur',
      { invoice_id: id, user_id: userId },
    );

    const { error } = await supabase
      .from('invoices')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return { clientSecret: paymentIntent.client_secret };
  }
}
