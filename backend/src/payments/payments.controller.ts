import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Create Stripe Checkout Session ─────────────────
  @Post('payments/create-checkout')
  async createCheckout(
    @Body()
    body: {
      bookingId: string;
      amount: number;
      guestEmail: string;
      guestName: string;
      propertyName: string;
    },
  ) {
    if (!body.bookingId || !body.amount) {
      throw new BadRequestException('bookingId and amount are required');
    }
    return this.paymentsService.createCheckoutSession(body);
  }

  // ─── Stripe Webhook ─────────────────────────────────
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RequestWithRawBody,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException(
        'Raw body not available. Ensure middleware is configured properly.',
      );
    }

    try {
      const event = this.paymentsService.constructEvent(
        request.rawBody,
        signature,
      );
      await this.paymentsService.handleEvent(event);
      return { received: true };
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
