import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLog } from './entities/message-log.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import * as Twilio from 'twilio';

interface SendMessageOptions {
  to: string;
  message: string;
  channel: 'whatsapp' | 'sms';
  bookingId?: string;
  propertyId?: string;
  recipientName?: string;
  templateKey?: string;
  sentBy?: string;
}

interface TemplateData {
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: string;
  currency: string;
  address?: string;
  checkinTime?: string;
  checkoutTime?: string;
  wifiName?: string;
  wifiPassword?: string;
  houseRules?: string;
  emergencyContact?: string;
  guestPortalUrl?: string;
  bookingRef?: string;
}

@Injectable()
export class MessagingService {
  private twilioClient: Twilio.Twilio | null = null;
  private twilioPhone: string;
  private twilioWhatsApp: string;
  private frontendUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(MessageLog)
    private messageLogRepo: Repository<MessageLog>,
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(Property)
    private propertiesRepo: Repository<Property>,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.twilioWhatsApp = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://triadak.io';

    if (accountSid && authToken) {
      this.twilioClient = Twilio.default(accountSid, authToken);
    }
  }

  // ─── Send a message (WhatsApp or SMS) ───
  async sendMessage(options: SendMessageOptions): Promise<MessageLog> {
    const log = this.messageLogRepo.create({
      bookingId: options.bookingId,
      propertyId: options.propertyId,
      recipientName: options.recipientName,
      recipientPhone: options.to,
      channel: options.channel,
      templateKey: options.templateKey,
      message: options.message,
      sentBy: options.sentBy,
      status: 'queued',
    });

    if (!this.twilioClient) {
      log.status = 'failed';
      log.errorMessage = 'Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.';
      await this.messageLogRepo.save(log);
      return log;
    }

    try {
      const from =
        options.channel === 'whatsapp'
          ? `whatsapp:${this.twilioWhatsApp}`
          : this.twilioPhone;

      const to =
        options.channel === 'whatsapp'
          ? `whatsapp:${options.to}`
          : options.to;

      const result = await this.twilioClient.messages.create({
        body: options.message,
        from,
        to,
      });

      log.status = 'sent';
      log.externalSid = result.sid;
    } catch (err: any) {
      log.status = 'failed';
      log.errorMessage = err.message || 'Unknown Twilio error';
    }

    await this.messageLogRepo.save(log);
    return log;
  }

  // ─── Send from template ───
  async sendFromTemplate(
    bookingId: string,
    templateKey: string,
    channel: 'whatsapp' | 'sms',
    sentBy?: string,
  ): Promise<MessageLog> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['property'],
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.guestPhone) {
      throw new Error('Guest has no phone number');
    }

    const data = this.buildTemplateData(booking);
    const message = this.renderTemplate(templateKey, data);

    return this.sendMessage({
      to: booking.guestPhone,
      message,
      channel,
      bookingId: booking.id,
      propertyId: booking.propertyId,
      recipientName: booking.guestName,
      templateKey,
      sentBy,
    });
  }

  // ─── Send custom message to a booking's guest ───
  async sendCustomMessage(
    bookingId: string,
    message: string,
    channel: 'whatsapp' | 'sms',
    sentBy?: string,
  ): Promise<MessageLog> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (!booking.guestPhone) throw new Error('Guest has no phone number');

    return this.sendMessage({
      to: booking.guestPhone,
      message,
      channel,
      bookingId: booking.id,
      propertyId: booking.propertyId,
      recipientName: booking.guestName,
      templateKey: 'custom',
      sentBy,
    });
  }

  // ─── Send to arbitrary phone number ───
  async sendDirect(
    phone: string,
    message: string,
    channel: 'whatsapp' | 'sms',
    sentBy?: string,
  ): Promise<MessageLog> {
    return this.sendMessage({
      to: phone,
      message,
      channel,
      sentBy,
    });
  }

  // ─── Get message logs ───
  async getLogs(filters?: {
    bookingId?: string;
    propertyId?: string;
    channel?: string;
    limit?: number;
  }): Promise<MessageLog[]> {
    const qb = this.messageLogRepo
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC');

    if (filters?.bookingId) {
      qb.andWhere('log.booking_id = :bookingId', { bookingId: filters.bookingId });
    }
    if (filters?.propertyId) {
      qb.andWhere('log.property_id = :propertyId', { propertyId: filters.propertyId });
    }
    if (filters?.channel) {
      qb.andWhere('log.channel = :channel', { channel: filters.channel });
    }

    qb.take(filters?.limit || 50);
    return qb.getMany();
  }

  // ─── Stats ───
  async getStats(): Promise<{
    total: number;
    whatsapp: number;
    sms: number;
    sent: number;
    failed: number;
    today: number;
  }> {
    const all = await this.messageLogRepo.find();
    const todayStr = new Date().toISOString().slice(0, 10);

    return {
      total: all.length,
      whatsapp: all.filter((m) => m.channel === 'whatsapp').length,
      sms: all.filter((m) => m.channel === 'sms').length,
      sent: all.filter((m) => m.status === 'sent' || m.status === 'delivered').length,
      failed: all.filter((m) => m.status === 'failed').length,
      today: all.filter((m) => m.createdAt?.toISOString().slice(0, 10) === todayStr).length,
    };
  }

  // ─── Available templates ───
  getTemplates(): Array<{ key: string; name: string; description: string; preview: string }> {
    return [
      {
        key: 'booking_confirmation',
        name: 'Booking Confirmation',
        description: 'Sent when a reservation is confirmed',
        preview: 'Hello {guestName}! Your reservation at {propertyName} is confirmed...',
      },
      {
        key: 'checkin_reminder',
        name: 'Check-in Reminder',
        description: 'Sent 24h before check-in',
        preview: 'Hi {guestName}! Your check-in at {propertyName} is tomorrow at {checkinTime}...',
      },
      {
        key: 'checkin_instructions',
        name: 'Check-in Instructions',
        description: 'WiFi, rules, and access details',
        preview: 'Welcome to {propertyName}! WiFi: {wifiName} / Password: {wifiPassword}...',
      },
      {
        key: 'checkout_reminder',
        name: 'Check-out Reminder',
        description: 'Sent morning of check-out',
        preview: 'Hi {guestName}, your check-out is today at {checkoutTime}...',
      },
      {
        key: 'guest_portal',
        name: 'Guest Portal Link',
        description: 'Sends the guest portal link',
        preview: 'Hi {guestName}! Access your stay details here: {guestPortalUrl}',
      },
      {
        key: 'thank_you',
        name: 'Thank You',
        description: 'Sent after check-out',
        preview: 'Thank you for staying at {propertyName}! We hope you had a great time...',
      },
    ];
  }

  // ─── Test Twilio connection ───
  async testConnection(): Promise<{ connected: boolean; phone?: string; whatsapp?: string; error?: string }> {
    if (!this.twilioClient) {
      return { connected: false, error: 'Twilio not configured' };
    }
    try {
      const account = await this.twilioClient.api.accounts(
        this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
      ).fetch();
      return {
        connected: true,
        phone: this.twilioPhone || undefined,
        whatsapp: this.twilioWhatsApp || undefined,
        error: account.status !== 'active' ? `Account status: ${account.status}` : undefined,
      };
    } catch (err: any) {
      return { connected: false, error: err.message };
    }
  }

  // ─── Private helpers ───

  private buildTemplateData(booking: Booking): TemplateData {
    const property = booking.property;
    const checkIn = new Date(booking.startDate);
    const checkOut = new Date(booking.endDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    const portalUrl = booking.guestToken
      ? `${this.frontendUrl}/guest/${booking.guestToken}`
      : undefined;

    return {
      guestName: booking.guestName,
      propertyName: property?.name || 'Property',
      checkIn: checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      checkOut: checkOut.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      nights,
      totalPrice: String(booking.totalPrice || 0),
      currency: booking.currency || 'USD',
      address: property?.address || undefined,
      checkinTime: property?.checkinTime || '15:00',
      checkoutTime: property?.checkoutTime || '11:00',
      wifiName: property?.wifiName || undefined,
      wifiPassword: property?.wifiPassword || undefined,
      houseRules: property?.houseRules || undefined,
      emergencyContact: property?.emergencyContact || undefined,
      guestPortalUrl: portalUrl,
      bookingRef: booking.id?.slice(0, 8)?.toUpperCase(),
    };
  }

  private renderTemplate(key: string, data: TemplateData): string {
    const templates: Record<string, string> = {
      booking_confirmation: [
        `Hello ${data.guestName}! 🎉`,
        ``,
        `Your reservation at *${data.propertyName}* is confirmed!`,
        ``,
        `📅 Check-in: ${data.checkIn}`,
        `📅 Check-out: ${data.checkOut}`,
        `🌙 ${data.nights} night${data.nights > 1 ? 's' : ''}`,
        `💰 Total: ${data.currency} ${data.totalPrice}`,
        `🔖 Ref: #${data.bookingRef}`,
        data.address ? `📍 ${data.address}` : '',
        ``,
        `We look forward to welcoming you!`,
        `— ${data.propertyName} via Triadak`,
      ].filter(Boolean).join('\n'),

      checkin_reminder: [
        `Hi ${data.guestName}! 👋`,
        ``,
        `Your check-in at *${data.propertyName}* is tomorrow!`,
        ``,
        `⏰ Check-in time: ${data.checkinTime}`,
        data.address ? `📍 Address: ${data.address}` : '',
        data.guestPortalUrl ? `\n📱 View all details: ${data.guestPortalUrl}` : '',
        ``,
        `See you soon!`,
        `— ${data.propertyName} via Triadak`,
      ].filter(Boolean).join('\n'),

      checkin_instructions: [
        `Welcome to *${data.propertyName}*! 🏠`,
        ``,
        data.wifiName ? `📶 WiFi: ${data.wifiName}` : '',
        data.wifiPassword ? `🔑 Password: ${data.wifiPassword}` : '',
        ``,
        data.houseRules ? `📋 House Rules:\n${data.houseRules}` : '',
        ``,
        data.emergencyContact ? `🆘 Emergency: ${data.emergencyContact}` : '',
        data.guestPortalUrl ? `\n📱 Full details: ${data.guestPortalUrl}` : '',
        ``,
        `Enjoy your stay!`,
        `— ${data.propertyName} via Triadak`,
      ].filter(Boolean).join('\n'),

      checkout_reminder: [
        `Hi ${data.guestName}! 🌅`,
        ``,
        `Just a friendly reminder — your check-out at *${data.propertyName}* is today.`,
        ``,
        `⏰ Check-out time: ${data.checkoutTime}`,
        ``,
        `Please make sure to:`,
        `• Leave the keys at the designated spot`,
        `• Close all windows and lock the door`,
        `• Take all your belongings`,
        ``,
        `Thank you for staying with us! 🙏`,
        `— ${data.propertyName} via Triadak`,
      ].join('\n'),

      guest_portal: [
        `Hi ${data.guestName}! 📱`,
        ``,
        `Here's the link to your Guest Portal for *${data.propertyName}*:`,
        ``,
        data.guestPortalUrl || '[Portal not available]',
        ``,
        `You'll find check-in instructions, WiFi details, house rules, and more.`,
        ``,
        `— ${data.propertyName} via Triadak`,
      ].join('\n'),

      thank_you: [
        `Thank you, ${data.guestName}! 🌟`,
        ``,
        `We hope you had an amazing stay at *${data.propertyName}*.`,
        ``,
        `We'd love to host you again. Don't hesitate to reach out for your next trip!`,
        ``,
        `Until next time! 👋`,
        `— ${data.propertyName} via Triadak`,
      ].join('\n'),
    };

    return templates[key] || `Message template "${key}" not found.`;
  }
}
