import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';

import { BookingsModule } from '../bookings/bookings.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [ConfigModule, BookingsModule, AccountingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
