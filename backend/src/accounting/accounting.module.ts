import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Settlement } from './entities/settlement.entity';

import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntry, Settlement, Booking])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService]
})
export class AccountingModule { }
