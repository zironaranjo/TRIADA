import { Body, Controller, Post } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
    constructor(private readonly emailsService: EmailsService) { }

    @Post('booking-confirmation')
    async sendBookingConfirmation(@Body() body: any) {
        const { booking } = body;

        // Validate basics
        if (!booking || !booking.guest_email) {
            return { success: false, message: 'Invalid booking data or email missing' };
        }

        // Call service to send email
        const result = await this.emailsService.sendBookingConfirmation(booking.guest_email, booking);
        return result;
    }
}
