import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

// Commission rates by plan (percentage of each booking transaction)
export const COMMISSION_RATES: Record<string, number> = {
  starter: 8,
  basic: 5,
  pro: 3,
  enterprise: 2,
};

// Stripe Price IDs — set via environment variables
// Format: STRIPE_PRICE_{PLAN}_{INTERVAL} e.g. STRIPE_PRICE_BASIC_MONTHLY
interface PlanPriceConfig {
  monthly: string;
  yearly: string;
}

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly frontendUrl: string;
  private readonly priceIds: Record<string, PlanPriceConfig>;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      // @ts-ignore
      apiVersion: '2026-01-28.clover',
    });

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://triadak.io';

    // Load Stripe Price IDs from env (or use placeholders for test mode)
    this.priceIds = {
      basic: {
        monthly:
          this.configService.get('STRIPE_PRICE_BASIC_MONTHLY') ||
          'price_basic_monthly',
        yearly:
          this.configService.get('STRIPE_PRICE_BASIC_YEARLY') ||
          'price_basic_yearly',
      },
      pro: {
        monthly:
          this.configService.get('STRIPE_PRICE_PRO_MONTHLY') ||
          'price_pro_monthly',
        yearly:
          this.configService.get('STRIPE_PRICE_PRO_YEARLY') ||
          'price_pro_yearly',
      },
      enterprise: {
        monthly:
          this.configService.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') ||
          'price_enterprise_monthly',
        yearly:
          this.configService.get('STRIPE_PRICE_ENTERPRISE_YEARLY') ||
          'price_enterprise_yearly',
      },
    };
  }

  /**
   * Create a Stripe Checkout session for subscription
   */
  async createCheckoutSession(data: {
    userId: string;
    email: string;
    planId: string;
    interval: 'monthly' | 'yearly';
  }) {
    const priceConfig = this.priceIds[data.planId];
    if (!priceConfig) {
      throw new Error(`Invalid plan: ${data.planId}`);
    }

    const priceId = priceConfig[data.interval];

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: data.email,
        metadata: {
          userId: data.userId,
          planId: data.planId,
          interval: data.interval,
        },
        subscription_data: {
          metadata: {
            userId: data.userId,
            planId: data.planId,
          },
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${this.frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${this.frontendUrl}/pricing?status=cancelled`,
        allow_promotion_codes: true,
      });

      this.logger.log(
        `Checkout session created: ${session.id} for user ${data.userId} plan ${data.planId}`,
      );

      return { url: session.url, sessionId: session.id };
    } catch (err) {
      this.logger.error(`Failed to create subscription checkout: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create a Stripe Customer Portal session for managing subscription
   */
  async createPortalSession(stripeCustomerId: string) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${this.frontendUrl}/billing`,
      });

      return { url: session.url };
    } catch (err) {
      this.logger.error(`Failed to create portal session: ${err.message}`);
      throw err;
    }
  }

  /**
   * Handle subscription-related webhook events
   */
  async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          this.logger.log(
            `Subscription checkout completed: ${session.id}, customer: ${session.customer}, subscription: ${session.subscription}`,
          );
          // The frontend will poll/update Supabase after redirect
          // For production, you'd update the subscriptions table here via Supabase Admin SDK
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(
          `Subscription updated: ${subscription.id}, status: ${subscription.status}`,
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(
          `Subscription cancelled: ${subscription.id}`,
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.warn(
          `Payment failed for invoice: ${invoice.id}, customer: ${invoice.customer}`,
        );
        break;
      }

      default:
        this.logger.debug(`Unhandled subscription event: ${event.type}`);
    }
  }

  /**
   * Get commission rate for a plan
   */
  getCommissionRate(planId: string): number {
    return COMMISSION_RATES[planId] ?? COMMISSION_RATES.starter;
  }

  /**
   * Retrieve a Stripe Checkout Session to verify payment
   */
  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      });
      return session;
    } catch (err) {
      this.logger.error(`Failed to retrieve session: ${err.message}`);
      throw err;
    }
  }
}
