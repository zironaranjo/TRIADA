import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity()
export class Settlement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column()
    bookingId: string;

    // Financial Breakdown
    @Column('decimal', { precision: 10, scale: 2 })
    totalRevenue: number; // What the guest paid

    @Column('decimal', { precision: 10, scale: 2 })
    platformFee: number; // Stripe + OTA fees

    @Column('decimal', { precision: 10, scale: 2 })
    managementFee: number; // Our agency commission (e.g. 20%)

    @Column('decimal', { precision: 10, scale: 2 })
    cleaningFee: number; // Pass-through expense

    @Column('decimal', { precision: 10, scale: 2 })
    ownerPayout: number; // Net amount for owner

    @Column({ default: 'PENDING' })
    status: 'PENDING' | 'PROCESSED' | 'PAID';

    @Column({ nullable: true })
    processedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
