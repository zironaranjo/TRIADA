import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('message_logs')
export class MessageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @Column({ name: 'property_id', nullable: true })
  propertyId: string;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName: string;

  @Column({ name: 'recipient_phone' })
  recipientPhone: string;

  @Column({ default: 'whatsapp' })
  channel: string; // whatsapp | sms

  @Column({ name: 'template_key', nullable: true })
  templateKey: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'sent' })
  status: string; // sent | delivered | failed | queued

  @Column({ name: 'external_sid', nullable: true })
  externalSid: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'sent_by', nullable: true })
  sentBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
