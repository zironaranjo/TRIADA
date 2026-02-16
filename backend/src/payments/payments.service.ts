import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { BookingsService } from '../bookings/bookings.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConnectService } from '../connect/connect.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private bookingsService: BookingsService,
    private accountingService: AccountingService,
    private subscriptionsService: SubscriptionsService,
    private connectService: ConnectService,
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

  // ─── Create Checkout Session (supports Stripe Connect) ──
  async createCheckoutSession(data: {
    bookingId: string;
    amount: number;
    guestEmail: string;
    guestName: string;
    propertyName: string;
    ownerId?: string;
    planId?: string;
  }) {
    try {
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'https://triadak.io';
      const amountInCents = Math.round(data.amount * 100);

      // Build session params
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: data.guestEmail,
        metadata: {
          bookingId: data.bookingId,
        },
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Booking - ${data.propertyName}`,
                description: `Reservation for ${data.guestName}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/bookings?payment=success`,
        cancel_url: `${frontendUrl}/bookings?payment=cancelled`,
      };

      // If the property owner has a Connect account, route payment through Connect
      if (data.ownerId) {
        const stripeAccountId = await this.connectService.getStripeAccountId(
          data.ownerId,
        );

        if (stripeAccountId) {
          const planId = data.planId || 'starter';
          const feeAmount = this.connectService.calculateApplicationFee(
            amountInCents,
            planId,
          );

          sessionParams.payment_intent_data = {
            application_fee_amount: feeAmount,
            transfer_data: {
              destination: stripeAccountId,
            },
          };

          this.logger.log(
            `Connect payment: ${stripeAccountId}, fee: ${feeAmount} cents (${planId} plan)`,
          );
        }
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(
        `Checkout session created: ${session.id} for booking ${data.bookingId}`,
      );

      return { url: session.url, sessionId: session.id };
    } catch (err) {
      this.logger.error(`Failed to create checkout: ${err.message}`);
      throw err;
    }
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
    // Subscription-related events
    const subscriptionEvents = [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_failed',
    ];

    if (subscriptionEvents.includes(event.type)) {
      await this.subscriptionsService.handleSubscriptionEvent(event);
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        this.logger.log(
          `Payment succeeded: ${paymentIntent.id} - Amount: ${paymentIntent.amount}`,
        );
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
