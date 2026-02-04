import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerEntry])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService]
})
export class AccountingModule { }
