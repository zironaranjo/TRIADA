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
  private frontendUrl: string;

  // Meta WhatsApp Cloud API
  private metaPhoneNumberId: string;
  private metaAccessToken: string;
  private metaApiVersion = 'v22.0';

  constructor(
    private configService: ConfigService,
    @InjectRepository(MessageLog)
    private messageLogRepo: Repository<MessageLog>,
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(Property)
    private propertiesRepo: Repository<Property>,
  ) {
    // Twilio for SMS
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://triadak.io';

    if (accountSid && authToken) {
      this.twilioClient = Twilio.default(accountSid, authToken);
    }

    // Meta WhatsApp Cloud API
    this.metaPhoneNumberId = this.configService.get<string>('META_WHATSAPP_PHONE_ID') || '';
    this.metaAccessToken = this.configService.get<string>('META_WHATSAPP_TOKEN') || '';
  }

  private get isMetaConfigured(): boolean {
    return !!(this.metaPhoneNumberId && this.metaAccessToken);
  }

  private get isTwilioConfigured(): boolean {
    return !!this.twilioClient;
  }

  // ─── Meta template name mapping (named parameters for Meta Cloud API) ───
  private readonly metaTemplateMap: Record<string, { name: string; paramBuilder: (data: TemplateData) => Array<{ name: string; value: string }> }> = {
    booking_confirmation: {
      name: 'triadak_booking_confirm',
      paramBuilder: (d) => [
        { name: 'guest_name', value: d.guestName },
        { name: 'property_name', value: d.propertyName },
        { name: 'checkin_date', value: d.checkIn },
        { name: 'checkout_date', value: d.checkOut },
        { name: 'nights', value: String(d.nights) },
        { name: 'total_price', value: `${d.currency} ${d.totalPrice}` },
      ],
    },
    checkin_reminder: {
      name: 'triadak_checkin_reminder',
      paramBuilder: (d) => [
        { name: 'guest_name', value: d.guestName },
        { name: 'property_name', value: d.propertyName },
        { name: 'checkin_time', value: d.checkinTime || '15:00' },
        { name: 'address', value: d.address || '' },
      ],
    },
    checkin_instructions: {
      name: 'triadak_stay_details',
      paramBuilder: (d) => [
        { name: 'property_name', value: d.propertyName },
        { name: 'wifi_name', value: d.wifiName || '' },
        { name: 'wifi_password', value: d.wifiPassword || '' },
        { name: 'guest_portal_url', value: d.guestPortalUrl || '' },
      ],
    },
    checkout_reminder: {
      name: 'triadak_checkout_reminder',
      paramBuilder: (d) => [
        { name: 'guest_name', value: d.guestName },
        { name: 'property_name', value: d.propertyName },
        { name: 'checkout_time', value: d.checkoutTime || '11:00' },
      ],
    },
    guest_portal: {
      name: 'triadak_guest_portal',
      paramBuilder: (d) => [
        { name: 'guest_name', value: d.guestName },
        { name: 'property_name', value: d.propertyName },
        { name: 'guest_portal_url', value: d.guestPortalUrl || '' },
      ],
    },
    thank_you: {
      name: 'triadak_thank_you',
      paramBuilder: (d) => [
        { name: 'guest_name', value: d.guestName },
        { name: 'property_name', value: d.propertyName },
      ],
    },
  };

  // ─── Send WhatsApp via Meta Cloud API (text message) ───
  private async sendWhatsAppText(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phone = to.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: true, body: message },
        }),
      });

      const data = await response.json() as any;
      if (!response.ok) {
        return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
      }
      return { success: true, messageId: data?.messages?.[0]?.id || '' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Meta API request failed' };
    }
  }

  // ─── Send WhatsApp via Meta Cloud API (template message with named params) ───
  private async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    params: Array<{ name: string; value: string }>,
    lang = 'en',
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const phone = to.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;

    const components: any[] = [];
    if (params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', parameter_name: p.name, text: p.value })),
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: lang },
            components,
          },
        }),
      });

      const data = await response.json() as any;
      if (!response.ok) {
        return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
      }
      return { success: true, messageId: data?.messages?.[0]?.id || '' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Meta API template request failed' };
    }
  }

  // ─── Send SMS via Twilio ───
  private async sendSmsTwilio(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    if (!this.twilioClient) {
      return { success: false, error: 'Twilio not configured for SMS' };
    }
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhone,
        to,
      });
      return { success: true, sid: result.sid };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ─── Send a message (WhatsApp or SMS) ───
  async sendMessage(options: SendMessageOptions & { metaTemplateName?: string; metaTemplateParams?: Array<{ name: string; value: string }> }): Promise<MessageLog> {
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

    if (options.channel === 'whatsapp') {
      if (!this.isMetaConfigured) {
        log.status = 'failed';
        log.errorMessage = 'Meta WhatsApp not configured. Set META_WHATSAPP_PHONE_ID and META_WHATSAPP_TOKEN.';
        await this.messageLogRepo.save(log);
        return log;
      }

      let result: { success: boolean; messageId?: string; error?: string };

      if (options.metaTemplateName && options.metaTemplateParams) {
        result = await this.sendWhatsAppTemplate(
          options.to,
          options.metaTemplateName,
          options.metaTemplateParams,
        );
      } else {
        result = await this.sendWhatsAppText(options.to, options.message);
      }

      if (result.success) {
        log.status = 'sent';
        log.externalSid = result.messageId ?? '';
      } else {
        log.status = 'failed';
        log.errorMessage = result.error || 'Unknown Meta API error';
      }
    } else {
      if (!this.isTwilioConfigured) {
        log.status = 'failed';
        log.errorMessage = 'Twilio not configured for SMS. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.';
        await this.messageLogRepo.save(log);
        return log;
      }

      const result = await this.sendSmsTwilio(options.to, options.message);
      if (result.success) {
        log.status = 'sent';
        log.externalSid = result.sid ?? '';
      } else {
        log.status = 'failed';
        log.errorMessage = result.error || 'Unknown Twilio error';
      }
    }

    await this.messageLogRepo.save(log);
    return log;
  }

  // ─── Send from template (uses Meta templates for WhatsApp) ───
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

    const metaTemplate = this.metaTemplateMap[templateKey];
    const useMetaTemplate = channel === 'whatsapp' && metaTemplate;

    return this.sendMessage({
      to: booking.guestPhone,
      message,
      channel,
      bookingId: booking.id,
      propertyId: booking.propertyId,
      recipientName: booking.guestName,
      templateKey,
      sentBy,
      metaTemplateName: useMetaTemplate ? metaTemplate.name : undefined,
      metaTemplateParams: useMetaTemplate ? metaTemplate.paramBuilder(data) : undefined,
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

  // ─── Test connection ───
  async testConnection(): Promise<{
    connected: boolean;
    whatsapp?: { provider: string; phoneId?: string };
    sms?: { provider: string; phone?: string };
    error?: string;
  }> {
    const result: any = { connected: false };

    // Test Meta WhatsApp
    if (this.isMetaConfigured) {
      result.whatsapp = { provider: 'Meta Cloud API', phoneId: this.metaPhoneNumberId };
      result.connected = true;
    }

    // Test Twilio SMS
    if (this.isTwilioConfigured) {
      try {
        const account = await this.twilioClient!.api.accounts(
          this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
        ).fetch();
        result.sms = { provider: 'Twilio', phone: this.twilioPhone };
        if (account.status === 'active') result.connected = true;
      } catch (err: any) {
        result.sms = { provider: 'Twilio', error: err.message };
      }
    }

    if (!this.isMetaConfigured && !this.isTwilioConfigured) {
      result.error = 'No messaging provider configured';
    }

    return result;
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
