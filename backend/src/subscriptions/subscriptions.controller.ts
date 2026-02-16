import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * POST /subscriptions/create-checkout
   * Creates a Stripe Checkout session for subscription payment
   */
  @Post('create-checkout')
  async createCheckout(
    @Body()
    body: {
      userId: string;
      email: string;
      planId: string;
      interval: 'monthly' | 'yearly';
    },
  ) {
    if (!body.userId || !body.planId) {
      throw new BadRequestException('userId and planId are required');
    }
    if (!body.email) {
      throw new BadRequestException('email is required');
    }
    return this.subscriptionsService.createCheckoutSession(body);
  }

  /**
   * POST /subscriptions/portal
   * Creates a Stripe Customer Portal session for managing subscription
   */
  @Post('portal')
  async createPortal(
    @Body() body: { stripeCustomerId: string },
  ) {
    if (!body.stripeCustomerId) {
      throw new BadRequestException('stripeCustomerId is required');
    }
    return this.subscriptionsService.createPortalSession(body.stripeCustomerId);
  }

  /**
   * GET /subscriptions/verify-session?session_id=xxx
   * Verifies a Stripe Checkout session after redirect
   */
  @Get('verify-session')
  async verifySession(@Query('session_id') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }
    return this.subscriptionsService.getCheckoutSession(sessionId);
  }

  /**
   * GET /subscriptions/commission-rate?planId=xxx
   * Returns the commission rate for a given plan
   */
  @Get('commission-rate')
  getCommissionRate(@Query('planId') planId: string) {
    const rate = this.subscriptionsService.getCommissionRate(planId || 'starter');
    return { planId: planId || 'starter', commissionRate: rate };
  }
}
