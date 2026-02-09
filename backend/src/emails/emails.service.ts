import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailsService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Pon tu clave real en .env
    }

    async sendBookingConfirmation(to: string, booking: any) {
        if (!to) {
            console.warn('No booking email provided');
            return;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: 'Triada <onboarding@resend.dev>', // O tu dominio verificado: 'reservas@tudominio.com'
                to: [to],
                subject: `Booking Confirmed #${booking.id.slice(0, 6)} - Triada`,
                html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h1 style="color: #2563eb; text-align: center;">Booking Confirmed! ✅</h1>
          <p>Hello <strong>${booking.guest_name}</strong>,</p>
          <p>Thank you for choosing Triada. Your reservation has been successfully created.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Reservation Details:</h3>
            <p><strong>Property:</strong> ${booking.properties?.name || 'Luxury Villa'}</p>
            <p><strong>Check-in:</strong> ${booking.start_date}</p>
            <p><strong>Check-out:</strong> ${booking.end_date}</p>
            <p><strong>Total Price:</strong> $${booking.total_price}</p>
          </div>

          <p>If you have any questions, feel free to reply to this email.</p>
          <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px;">
            © ${new Date().getFullYear()} Triada. All rights reserved.
          </p>
        </div>
        `,
            });

            if (error) {
                console.error('Error sending email:', error);
                return { success: false, error };
            }

            console.log('Email sent successfully:', data);
            return { success: true, data };
        } catch (err) {
            console.error('Unexpected error sending email:', err);
            return { success: false, error: err };
        }
    }
}
