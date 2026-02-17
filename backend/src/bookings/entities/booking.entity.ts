import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ name: 'guest_email', nullable: true })
  guestEmail: string;

  @Column({ name: 'guest_phone', nullable: true })
  guestPhone: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column('decimal', { name: 'total_price', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'DIRECT' })
  platform: string;

  @Column({ name: 'ical_uid', nullable: true })
  icalUid: string;

  @Column({ name: 'property_id', nullable: true })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.bookings, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'guest_token', type: 'uuid', nullable: true })
  guestToken: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
