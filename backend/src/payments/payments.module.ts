import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ConfigModule } from '@nestjs/config';

import { BookingsModule } from '../bookings/bookings.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ConnectModule } from '../connect/connect.module';

@Module({
  imports: [
    ConfigModule,
    BookingsModule,
    AccountingModule,
    SubscriptionsModule,
    ConnectModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
