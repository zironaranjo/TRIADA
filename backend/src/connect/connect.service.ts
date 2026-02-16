import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeConnectAccount } from './entities/stripe-connect-account.entity';
import { COMMISSION_RATES } from '../subscriptions/subscriptions.service';

@Injectable()
export class ConnectService {
  private stripe: Stripe;
  private readonly logger = new Logger(ConnectService.name);
  private readonly frontendUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(StripeConnectAccount)
    private connectRepository: Repository<StripeConnectAccount>,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      // @ts-ignore
      apiVersion: '2026-01-28.clover',
    });

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://staging.triadak.io';
  }

  /**
   * Create or retrieve a Stripe Express account for a user
   */
  async createExpressAccount(userId: string): Promise<string> {
    // Check if user already has a Connect account
    const existing = await this.connectRepository.findOne({
      where: { userId },
    });

    if (existing) {
      return existing.stripeAccountId;
    }

    // Create new Express account
    const account = await this.stripe.accounts.create({
      type: 'express',
      metadata: { userId },
    });

    // Save to database
    const connectAccount = this.connectRepository.create({
      userId,
      stripeAccountId: account.id,
      status: 'pending',
      chargesEnabled: false,
      payoutsEnabled: false,
    });
    await this.connectRepository.save(connectAccount);

    this.logger.log(
      `Created Express account ${account.id} for user ${userId}`,
    );

    return account.id;
  }

  /**
   * Generate an onboarding link for Stripe Express
   */
  async createOnboardingLink(userId: string): Promise<{ url: string }> {
    const accountId = await this.createExpressAccount(userId);

    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${this.frontendUrl}/billing?connect=refresh`,
      return_url: `${this.frontendUrl}/billing?connect=complete`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  /**
   * Get Connect account status for a user
   */
  async getAccountStatus(userId: string): Promise<{
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    stripeAccountId: string | null;
  }> {
    const existing = await this.connectRepository.findOne({
      where: { userId },
    });

    if (!existing) {
      return {
        status: 'not_connected',
        chargesEnabled: false,
        payoutsEnabled: false,
        stripeAccountId: null,
      };
    }

    // Refresh status from Stripe
    try {
      const account = await this.stripe.accounts.retrieve(
        existing.stripeAccountId,
      );

      existing.chargesEnabled = account.charges_enabled;
      existing.payoutsEnabled = account.payouts_enabled;
      existing.status = account.charges_enabled ? 'active' : 'pending';
      await this.connectRepository.save(existing);

      return {
        status: existing.status,
        chargesEnabled: existing.chargesEnabled,
        payoutsEnabled: existing.payoutsEnabled,
        stripeAccountId: existing.stripeAccountId,
      };
    } catch (err) {
      this.logger.warn(`Failed to refresh account status: ${err.message}`);
      return {
        status: existing.status,
        chargesEnabled: existing.chargesEnabled,
        payoutsEnabled: existing.payoutsEnabled,
        stripeAccountId: existing.stripeAccountId,
      };
    }
  }

  /**
   * Get the Stripe Express dashboard link for a connected account
   */
  async getDashboardLink(userId: string): Promise<{ url: string }> {
    const existing = await this.connectRepository.findOne({
      where: { userId },
    });

    if (!existing) {
      throw new Error('No Connect account found for this user');
    }

    const loginLink = await this.stripe.accounts.createLoginLink(
      existing.stripeAccountId,
    );

    return { url: loginLink.url };
  }

  /**
   * Get the Stripe account ID for a user (used when processing payments)
   */
  async getStripeAccountId(userId: string): Promise<string | null> {
    const existing = await this.connectRepository.findOne({
      where: { userId },
    });
    return existing?.stripeAccountId || null;
  }

  /**
   * Calculate application fee amount for a booking payment
   */
  calculateApplicationFee(amount: number, planId: string): number {
    const rate = COMMISSION_RATES[planId] ?? COMMISSION_RATES.starter;
    return Math.round(amount * (rate / 100));
  }
}
