import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CrmService } from '../crm/crm.service';
import { AccountingService } from '../accounting/accounting.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly crmService: CrmService,
    private readonly accountingService: AccountingService,
    private readonly emailsService: EmailsService,
  ) {}

  async create(createBookingDto: any) {
    const booking = this.bookingsRepository.create(createBookingDto);
    const result = await this.bookingsRepository.save(booking);

    // Cast to single entity (TypeScript inference bug workaround)
    const savedBooking = Array.isArray(result) ? result[0] : result;

    // Sync to CRM
    await this.crmService.create({
      firstName: savedBooking.guestName?.split(' ')[0] || 'Guest',
      lastName: savedBooking.guestName?.split(' ').slice(1).join(' ') || '',
      source: 'BOOKING',
      type: 'GUEST',
      email: createBookingDto.email || `guest_${savedBooking.id}@temp.com`,
      phone: createBookingDto.phone,
    } as any).catch(() => {});

    // Sync to Accounting
    await this.accountingService.createEntry({
      bookingId: savedBooking.id,
      description: `Booking Revenue - ${savedBooking.guestName}`,
      amount: Number(savedBooking.totalPrice),
      type: 'CREDIT',
      account: 'OWNER_BALANCE',
    });

    // Send booking confirmation email
    const guestEmail = createBookingDto.guest_email || createBookingDto.email;
    if (guestEmail) {
      await this.emailsService.sendBookingConfirmation(guestEmail, {
        ...savedBooking,
        guest_name: savedBooking.guestName,
        guest_email: guestEmail,
        start_date: savedBooking.startDate,
        end_date: savedBooking.endDate,
        total_price: savedBooking.totalPrice,
        properties: { name: createBookingDto.propertyName || 'Property' },
      }).catch((err) => console.error('Failed to send booking email:', err));
    }

    return savedBooking;
  }

  findAll() {
    return this.bookingsRepository.find({ relations: ['property'] });
  }

  findOne(id: string) {
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['property'],
    });
  }

  async updateStatus(id: string, status: string) {
    return this.bookingsRepository.update(id, { status });
  }
}
