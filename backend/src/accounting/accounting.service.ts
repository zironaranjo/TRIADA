import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Settlement } from './entities/settlement.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class AccountingService {
    constructor(
        @InjectRepository(LedgerEntry)
        private ledgerRepository: Repository<LedgerEntry>,
        @InjectRepository(Settlement)
        private settlementRepository: Repository<Settlement>,
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,
    ) { }

    async createEntry(data: Partial<LedgerEntry>) {
        const entry = this.ledgerRepository.create(data);
        return this.ledgerRepository.save(entry);
    }

    async generateSettlement(bookingId: string, amount: number) {
        // 1. Get the booking to know the platform
        const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
        if (!booking) throw new Error('Booking not found for settlement');

        // 2. Define Rates based on Platform
        const AGENCY_RATE = 0.20; // 20% always for us
        const CLEANING_COST = 50; // Hardcoded for MVP

        let platformFeeRate = 0;

        if (booking.platform === 'DIRECT') {
            platformFeeRate = 0.03; // Stripe 3%
        } else if (booking.platform === 'AIRBNB') {
            platformFeeRate = 0.03; // Airbnb Host Fee 3%
        } else {
            platformFeeRate = 0.15; // Booking.com usually higher
        }

        // 3. Calculate
        const platformFee = amount * platformFeeRate;
        const managementFee = amount * AGENCY_RATE;
        const ownerPayout = amount - platformFee - managementFee - CLEANING_COST;

        const settlement = this.settlementRepository.create({
            bookingId,
            totalRevenue: amount,
            platformFee,
            managementFee,
            cleaningFee: CLEANING_COST,
            ownerPayout,
            status: 'PENDING',
        });

        const saved = await this.settlementRepository.save(settlement);

        // ... rest of the code

        // Generate Ledger Entries for these splits
        await this.createEntry({
            bookingId,
            description: 'Agency Commission',
            amount: managementFee,
            type: 'CREDIT',
            account: 'AGENCY_COMMISSION'
        });

        await this.createEntry({
            bookingId,
            description: 'Owner Payout Pending',
            amount: ownerPayout,
            type: 'CREDIT',
            account: 'OWNER_BALANCE'
        });

        return saved;
    }

    async getDashboardStats() {
        const stats = await this.settlementRepository
            .createQueryBuilder("settlement")
            .select("SUM(settlement.totalRevenue)", "totalRevenue")
            .addSelect("SUM(settlement.platformFee)", "platformFees")
            .addSelect("SUM(settlement.managementFee)", "agencyRevenue")
            .addSelect("SUM(settlement.ownerPayout)", "ownerPayouts")
            .getRawOne();

        return {
            totalRevenue: Number(stats.totalRevenue) || 0,
            platformFees: Number(stats.platformFees) || 0,
            agencyRevenue: Number(stats.agencyRevenue) || 0,
            ownerPayouts: Number(stats.ownerPayouts) || 0,
            recentSettlements: await this.settlementRepository.find({
                take: 5,
                order: { createdAt: 'DESC' },
                relations: ['booking']
            })
        };
    }
}
