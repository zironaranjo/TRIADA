import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Property } from '../../properties/entities/property.entity';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    guestName: string;

    @Column('date')
    startDate: Date;

    @Column('date')
    endDate: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    totalPrice: number;

    @Column({ default: 'CONFIRMED' })
    status: string;

    @Column({ default: 'DIRECT' })
    platform: 'DIRECT' | 'AIRBNB' | 'BOOKING_COM';

    @Column({ nullable: true })
    icalUid: string; // To prevent duplicates from iCal sync

    @ManyToOne(() => Property, (property) => property.bookings, { nullable: true })
    property: Property;

    @CreateDateColumn()
    createdAt: Date;
}
