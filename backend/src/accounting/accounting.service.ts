import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Injectable()
export class AccountingService {
    constructor(
        @InjectRepository(LedgerEntry)
        private ledgerRepository: Repository<LedgerEntry>,
    ) { }

    async createEntry(data: Partial<LedgerEntry>) {
        const entry = this.ledgerRepository.create(data);
        return this.ledgerRepository.save(entry);
    }
}
