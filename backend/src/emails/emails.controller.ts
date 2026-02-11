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
}
