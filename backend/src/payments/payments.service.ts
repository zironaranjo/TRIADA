import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe'; // Ensure usage of default import or * as Stripe

import { BookingsService } from '../bookings/bookings.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private accountingService: AccountingService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      // @ts-ignore - Bypass version check if SDK types drift, or use explicit version if known
      apiVersion: '2026-01-28.clover',
    });
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw err;
    }
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        this.logger.log(
          `💰 Payment succeeded detected: ${paymentIntent.id} - Amount: ${paymentIntent.amount}`,
        );
        // Here we will integrate logic to search for the booking metadata
        await this.handlePaymentSuccess(paymentIntent);
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn(
        `Payment ${paymentIntent.id} missing keys: 'bookingId' in metadata`,
      );
      return;
    }

    this.logger.log(`Processing valid payment for Booking ID: ${bookingId}`);

    // 1. Update Booking Status
    await this.bookingsService.updateStatus(bookingId, 'PAID');

    // 2. Generate Settlement Implementation (Financial Split)
    // This handles: Revenue - Fees - Commission = Payout
    await this.accountingService.generateSettlement(
      bookingId,
      paymentIntent.amount / 100,
    );

    this.logger.log(`Settlement generated for booking ${bookingId}`);
  }
}
