import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailsService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');
  }

  // --- Generate Premium Email HTML ---
  private generateBookingEmailHTML(booking: any): string {
    const propertyName = booking.properties?.name || 'Luxury Property';
    const checkIn = new Date(booking.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const checkOut = new Date(booking.end_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const nights = Math.ceil(
      (new Date(booking.end_date).getTime() -
        new Date(booking.start_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const bookingRef = booking.id?.slice(0, 8)?.toUpperCase() || 'N/A';
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Triada</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                            <img src="https://triadak.io/logotriadak.png" alt="Triadak" width="180" style="display: block; max-width: 180px; height: auto;" />
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
                                
                                <!-- Success Banner -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 28px 32px; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 36px;">✅</p>
                                        <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">
                                            Booking Confirmed!
                                        </h2>
                                        <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">
                                            Reference: <strong style="font-family: monospace; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px;">#${bookingRef}</strong>
                                        </p>
                                    </td>
                                </tr>

                                <!-- Greeting -->
                                <tr>
                                    <td style="padding: 32px 32px 16px 32px;">
                                        <p style="margin: 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                                            Hello <strong style="color: #ffffff;">${booking.guest_name}</strong>,
                                        </p>
                                        <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                                            Your reservation has been confirmed. Here are the details of your stay:
                                        </p>
                                    </td>
                                </tr>

                                <!-- Property Card -->
                                <tr>
                                    <td style="padding: 8px 32px 24px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155;">
                                            <tr>
                                                <td style="padding: 20px 24px;">
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td>
                                                                <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                                                    Property
                                                                </p>
                                                                <p style="margin: 0; font-size: 18px; color: #ffffff; font-weight: 700;">
                                                                    🏠 ${propertyName}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Dates Grid -->
                                <tr>
                                    <td style="padding: 0 32px 24px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <!-- Check-in -->
                                                <td width="48%" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                                        📅 Check-in
                                                    </p>
                                                    <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: 600;">
                                                        ${checkIn}
                                                    </p>
                                                </td>
                                                <td width="4%"></td>
                                                <!-- Check-out -->
                                                <td width="48%" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                                        📅 Check-out
                                                    </p>
                                                    <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: 600;">
                                                        ${checkOut}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Summary Row -->
                                <tr>
                                    <td style="padding: 0 32px 32px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e3a5f, #1e293b); border-radius: 12px; border: 1px solid #334155;">
                                            <tr>
                                                <!-- Nights -->
                                                <td style="padding: 20px 24px; border-right: 1px solid #334155;" align="center">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                                        Nights
                                                    </p>
                                                    <p style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 800;">
                                                        🌙 ${nights}
                                                    </p>
                                                </td>
                                                <!-- Total -->
                                                <td style="padding: 20px 24px;" align="center">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                                                        Total Price
                                                    </p>
                                                    <p style="margin: 0; font-size: 28px; color: #34d399; font-weight: 800;">
                                                        $${booking.total_price}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 0 32px;">
                                        <div style="height: 1px; background-color: #334155;"></div>
                                    </td>
                                </tr>

                                <!-- Info Note -->
                                <tr>
                                    <td style="padding: 24px 32px 32px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #172554; border-radius: 12px; border: 1px solid #1e40af;">
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <p style="margin: 0; color: #93c5fd; font-size: 13px; line-height: 1.6;">
                                                        💡 <strong>Need help?</strong> Simply reply to this email and our team will assist you with any questions about your stay.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 0; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px;">
                                © ${year} Triadak · Vacational Renting Platform
                            </p>
                            <p style="margin: 0; color: #334155; font-size: 11px;">
                                This is an automated confirmation. Please do not reply unless you need assistance.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
  }

  // --- Send Booking Confirmation Email ---
  async sendBookingConfirmation(to: string, booking: any) {
    if (!to) {
      console.warn('No booking email provided');
      return;
    }

    try {
      const bookingRef = booking.id?.slice(0, 8)?.toUpperCase() || 'N/A';
      const propertyName = booking.properties?.name || 'Property';

      const { data, error } = await this.resend.emails.send({
        from: 'Triadak Reservas <reservas@triadak.io>',
        to: [to],
        subject: `✅ Booking Confirmed #${bookingRef} · ${propertyName} - Triadak`,
        html: this.generateBookingEmailHTML(booking),
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
