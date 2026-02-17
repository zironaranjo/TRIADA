import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';

@Entity('platform_connections')
export class PlatformConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, { nullable: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  platform: string; // airbnb, booking_com, vrbo, lodgify, other

  @Column({ name: 'connection_type', default: 'ical' })
  connectionType: string; // ical, api

  @Column({ name: 'ical_url', type: 'text', nullable: true })
  icalUrl: string;

  @Column({ name: 'api_key', type: 'text', nullable: true })
  apiKey: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({ name: 'external_property_id', nullable: true })
  externalPropertyId: string;

  @Column({ name: 'auto_sync_enabled', default: false })
  autoSyncEnabled: boolean;

  @Column({ name: 'sync_interval_minutes', default: 60 })
  syncIntervalMinutes: number;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'last_sync_status', nullable: true })
  lastSyncStatus: string; // success, error, partial

  @Column({ name: 'last_sync_message', type: 'text', nullable: true })
  lastSyncMessage: string;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
