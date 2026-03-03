import { Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  async findAll(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return data;
  }

  async create(userId: string, dto: CreateClientDto) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, dto: UpdateClientDto) {
    await this.findOne(id, userId);

    const { data, error } = await supabase
      .from('clients')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
