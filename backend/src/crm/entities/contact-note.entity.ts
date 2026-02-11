import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contact } from './contact.entity';

@Entity('contact_notes')
export class ContactNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ default: 'NOTE' })
  type: string; // NOTE, CALL, EMAIL, MEETING, BOOKING

  @Column('text')
  content: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
