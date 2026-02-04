import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Owner } from '../../owners/entities/owner.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity()
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    pricePerNight: number;

    @Column('int', { default: 1 })
    bedrooms: number;

    @Column('int', { default: 1 })
    bathrooms: number;

    @Column('int', { default: 2 })
    maxGuests: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Owner, (owner) => owner.properties, { nullable: true })
    owner: Owner;

    @OneToMany(() => Booking, (booking) => booking.property)
    bookings: Booking[];
}
