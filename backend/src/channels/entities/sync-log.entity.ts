import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PlatformConnection } from './platform-connection.entity';

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'connection_id' })
  connectionId: string;

  @ManyToOne(() => PlatformConnection, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id' })
  connection: PlatformConnection;

  @Column({ name: 'property_id' })
  propertyId: string;

  @Column()
  platform: string;

  @Column({ name: 'sync_type', default: 'manual' })
  syncType: string; // manual, auto

  @Column({ default: 'success' })
  status: string; // success, error, partial

  @Column({ default: 0 })
  added: number;

  @Column({ default: 0 })
  updated: number;

  @Column({ default: 0 })
  errors: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
