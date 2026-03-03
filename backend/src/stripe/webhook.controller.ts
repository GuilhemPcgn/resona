import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { supabase } from '../integrations/supabase/client';

@Controller('stripe')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        req.body as Buffer,
        signature,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_date: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        this.logger.log(`Invoice paid for PaymentIntent ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        this.logger.warn(`Payment failed for PaymentIntent ${paymentIntent.id}`);
        break;
      }

      case 'invoice.paid': {
        this.logger.log(`Stripe invoice.paid received: ${event.id}`);
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }
}
