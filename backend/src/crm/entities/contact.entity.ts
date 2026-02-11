import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: 'GUEST' })
  type: string; // GUEST, OWNER, VENDOR, OTHER

  @Column({ default: 'MANUAL' })
  source: string; // MANUAL, AIRBNB, BOOKING_COM, DIRECT, VRBO, OTHER

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'total_bookings', type: 'int', default: 0 })
  totalBookings: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'last_contact_date', type: 'timestamp', nullable: true })
  lastContactDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
