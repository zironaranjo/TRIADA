import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CrmService } from '../crm/crm.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private readonly bookingsRepository: Repository<Booking>,
        private readonly crmService: CrmService,
        private readonly accountingService: AccountingService,
    ) { }

    async create(createBookingDto: any) {
        const booking = this.bookingsRepository.create(createBookingDto);
        const result = await this.bookingsRepository.save(booking);

        // Cast to single entity (TypeScript inference bug workaround)
        const savedBooking = Array.isArray(result) ? result[0] : result;

        // Sync to CRM
        await this.crmService.createContact({
            name: savedBooking.guestName,
            source: 'BOOKING',
            email: createBookingDto.email || `guest_${savedBooking.id}@temp.com`,
            phone: createBookingDto.phone,
        });

        // Sync to Accounting
        await this.accountingService.createEntry({
            bookingId: savedBooking.id,
            description: `Booking Revenue - ${savedBooking.guestName}`,
            amount: Number(savedBooking.totalPrice),
            type: 'CREDIT',
            account: 'OWNER_BALANCE',
        });

        return savedBooking;
    }

    findAll() {
        return this.bookingsRepository.find({ relations: ['property'] });
    }

    findOne(id: string) {
        return this.bookingsRepository.findOne({
            where: { id },
            relations: ['property']
        });
    }
}
