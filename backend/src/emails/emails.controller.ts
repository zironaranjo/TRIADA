import { Body, Controller, Post, Get } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  // Health check endpoint
  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'emails' };
  }

  @Post('booking-confirmation')
  async sendBookingConfirmation(@Body() body: any) {
    try {
      console.log('📧 Received email request:', JSON.stringify(body));

      const { booking } = body;

      // Validate basics
      if (!booking || !booking.guest_email) {
        console.warn('⚠️ Missing booking data or email');
        return {
          success: false,
          message: 'Invalid booking data or email missing',
        };
      }

      console.log(`📧 Sending email to: ${booking.guest_email}`);

      // Call service to send email
      const result = await this.emailsService.sendBookingConfirmation(
        booking.guest_email,
        booking,
      );

      console.log('📧 Email result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('❌ Email controller error:', error);
      return {
        success: false,
        message: 'Internal error sending email',
        error: String(error),
      };
    }
  }

  @Post('task-assigned')
  async sendTaskAssigned(
    @Body()
    body: {
      to: string;
      staffName: string;
      taskType: string;
      propertyName: string;
      scheduledDate: string;
      notes?: string | null;
      portalUrl?: string;
    },
  ) {
    const portalUrl = body.portalUrl || 'https://triadak.io/worker/tasks';
    return this.emailsService.sendTaskAssigned(body.to, {
      staffName: body.staffName,
      taskType: body.taskType,
      propertyName: body.propertyName,
      scheduledDate: body.scheduledDate,
      notes: body.notes,
      portalUrl,
    });
  }
}
