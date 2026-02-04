import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class LedgerEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    bookingId: string; // Reference to booking if applicable

    @Column()
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column()
    type: 'DEBIT' | 'CREDIT';

    @Column()
    account: 'BANK' | 'STRIPE' | 'OWNER_BALANCE' | 'AGENCY_COMMISSION';

    @CreateDateColumn()
    createdAt: Date;
}
