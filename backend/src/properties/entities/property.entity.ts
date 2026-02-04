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

    @ManyToOne(() => Owner, (owner) => owner.properties)
    owner: Owner;

    @OneToMany(() => Booking, (booking) => booking.property)
    bookings: Booking[];
}
