import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Owner } from '../../owners/entities/owner.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column('decimal', { name: 'price_per_night', precision: 10, scale: 2, default: 0 })
  pricePerNight: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: 'active' })
  status: string;

  @Column('int', { default: 1 })
  rooms: number;

  @Column('int', { name: 'max_guests', default: 2 })
  maxGuests: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'ical_url', type: 'text', nullable: true })
  icalUrl: string;

  @Column({ name: 'checkin_instructions', type: 'text', nullable: true })
  checkinInstructions: string;

  @Column({ name: 'checkout_instructions', type: 'text', nullable: true })
  checkoutInstructions: string;

  @Column({ name: 'wifi_name', nullable: true })
  wifiName: string;

  @Column({ name: 'wifi_password', nullable: true })
  wifiPassword: string;

  @Column({ name: 'house_rules', type: 'text', nullable: true })
  houseRules: string;

  @Column({ name: 'emergency_contact', nullable: true })
  emergencyContact: string;

  @Column({ name: 'checkin_time', nullable: true, default: '15:00' })
  checkinTime: string;

  @Column({ name: 'checkout_time', nullable: true, default: '11:00' })
  checkoutTime: string;

  @Column({ name: 'guest_portal_enabled', default: true })
  guestPortalEnabled: boolean;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @ManyToOne(() => Owner, (owner) => owner.properties, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => Booking, (booking) => booking.property)
  bookings: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
