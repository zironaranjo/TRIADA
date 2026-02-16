import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ConnectService } from './connect.service';

@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  /**
   * POST /connect/onboard
   * Starts Stripe Express onboarding for a property manager
   */
  @Post('onboard')
  async onboard(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }
    return this.connectService.createOnboardingLink(body.userId);
  }

  /**
   * GET /connect/status?userId=xxx
   * Returns the Connect account status for a user
   */
  @Get('status')
  async getStatus(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.connectService.getAccountStatus(userId);
  }

  /**
   * GET /connect/dashboard-link?userId=xxx
   * Returns a login link to the Stripe Express dashboard
   */
  @Get('dashboard-link')
  async getDashboardLink(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.connectService.getDashboardLink(userId);
  }
}
