import {
  Controller,
  Post,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // POST /messaging/send-template
  @Post('send-template')
  async sendTemplate(
    @Body()
    body: {
      bookingId: string;
      templateKey: string;
      channel: 'whatsapp' | 'sms';
      sentBy?: string;
    },
  ) {
    return this.messagingService.sendFromTemplate(
      body.bookingId,
      body.templateKey,
      body.channel,
      body.sentBy,
    );
  }

  // POST /messaging/send-custom
  @Post('send-custom')
  async sendCustom(
    @Body()
    body: {
      bookingId: string;
      message: string;
      channel: 'whatsapp' | 'sms';
      sentBy?: string;
    },
  ) {
    return this.messagingService.sendCustomMessage(
      body.bookingId,
      body.message,
      body.channel,
      body.sentBy,
    );
  }

  // POST /messaging/send-direct
  @Post('send-direct')
  async sendDirect(
    @Body()
    body: {
      phone: string;
      message: string;
      channel: 'whatsapp' | 'sms';
      sentBy?: string;
    },
  ) {
    return this.messagingService.sendDirect(
      body.phone,
      body.message,
      body.channel,
      body.sentBy,
    );
  }

  // GET /messaging/logs
  @Get('logs')
  async getLogs(
    @Query('bookingId') bookingId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('channel') channel?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getLogs({
      bookingId,
      propertyId,
      channel,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  // GET /messaging/templates
  @Get('templates')
  getTemplates() {
    return this.messagingService.getTemplates();
  }

  // GET /messaging/stats
  @Get('stats')
  async getStats() {
    return this.messagingService.getStats();
  }

  // GET /messaging/test-connection
  @Get('test-connection')
  async testConnection() {
    return this.messagingService.testConnection();
  }
}
