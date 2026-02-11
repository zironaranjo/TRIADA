import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { CrmModule } from '../crm/crm.module';
import { AccountingModule } from '../accounting/accounting.module';

import { IcalService } from './ical.service';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Property]),
    CrmModule,
    AccountingModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, IcalService],
  exports: [BookingsService],
})
export class BookingsModule {}
