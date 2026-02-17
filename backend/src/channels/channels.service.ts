import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConnection } from './entities/platform-connection.entity';
import { SyncLog } from './entities/sync-log.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import * as ical from 'node-ical';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(PlatformConnection)
    private connectionsRepo: Repository<PlatformConnection>,
    @InjectRepository(SyncLog)
    private syncLogsRepo: Repository<SyncLog>,
    @InjectRepository(Booking)
    private bookingsRepo: Repository<Booking>,
    @InjectRepository(Property)
    private propertiesRepo: Repository<Property>,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────

  async findAllConnections(): Promise<PlatformConnection[]> {
    return this.connectionsRepo.find({
      relations: ['property'],
      order: { createdAt: 'DESC' },
    });
  }

  async findConnectionsByProperty(propertyId: string): Promise<PlatformConnection[]> {
    return this.connectionsRepo.find({
      where: { propertyId },
      relations: ['property'],
      order: { createdAt: 'DESC' },
    });
  }

  async findConnectionById(id: string): Promise<PlatformConnection> {
    const conn = await this.connectionsRepo.findOne({
      where: { id },
      relations: ['property'],
    });
    if (!conn) throw new NotFoundException('Connection not found');
    return conn;
  }

  async createConnection(data: Partial<PlatformConnection>): Promise<PlatformConnection> {
    const connection = this.connectionsRepo.create(data);
    const saved = await this.connectionsRepo.save(connection);

    // Also update the property's ical_url if it's an iCal connection
    if (data.connectionType === 'ical' && data.icalUrl && data.propertyId) {
      await this.propertiesRepo.update(data.propertyId, { icalUrl: data.icalUrl });
    }

    return saved;
  }

  async updateConnection(id: string, data: Partial<PlatformConnection>): Promise<PlatformConnection> {
    await this.connectionsRepo.update(id, data);
    const updated = await this.findConnectionById(id);

    // Keep property's ical_url in sync
    if (data.icalUrl !== undefined && updated.connectionType === 'ical') {
      await this.propertiesRepo.update(updated.propertyId, { icalUrl: data.icalUrl });
    }

    return updated;
  }

  async deleteConnection(id: string): Promise<void> {
    const conn = await this.findConnectionById(id);
    // Clear property's ical_url if this was the iCal connection
    if (conn.connectionType === 'ical') {
      await this.propertiesRepo.update(conn.propertyId, { icalUrl: undefined });
    }
    await this.connectionsRepo.delete(id);
  }

  // ─── SYNC ────────────────────────────────────────────────

  async syncConnection(connectionId: string, syncType: 'manual' | 'auto' = 'manual') {
    const connection = await this.findConnectionById(connectionId);

    if (!connection.enabled) {
      return { added: 0, updated: 0, errors: 0, message: 'Connection is disabled' };
    }

    // Create sync log entry
    const syncLog = this.syncLogsRepo.create({
      connectionId: connection.id,
      propertyId: connection.propertyId,
      platform: connection.platform,
      syncType,
      status: 'success',
    });

    try {
      let result: { added: number; updated: number; errors: number; message: string };

      if (connection.connectionType === 'ical' && connection.icalUrl) {
        result = await this.syncIcal(connection);
      } else if (connection.connectionType === 'api') {
        result = await this.syncApi(connection);
      } else {
        throw new Error('No sync method available for this connection');
      }

      // Update connection with sync result
      await this.connectionsRepo.update(connection.id, {
        lastSyncAt: new Date(),
        lastSyncStatus: result.errors > 0 ? 'partial' : 'success',
        lastSyncMessage: result.message,
      });

      // Complete sync log
      syncLog.added = result.added;
      syncLog.updated = result.updated;
      syncLog.errors = result.errors;
      syncLog.message = result.message;
      syncLog.status = result.errors > 0 ? 'partial' : 'success';
      syncLog.completedAt = new Date();
      await this.syncLogsRepo.save(syncLog);

      return result;
    } catch (error) {
      // Update connection with error
      await this.connectionsRepo.update(connection.id, {
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncMessage: error.message,
      });

      syncLog.status = 'error';
      syncLog.message = error.message;
      syncLog.completedAt = new Date();
      await this.syncLogsRepo.save(syncLog);

      throw error;
    }
  }

  private async syncIcal(connection: PlatformConnection) {
    this.logger.log(`Syncing iCal for ${connection.platform} → property ${connection.propertyId}`);

    const events = await ical.async.fromURL(connection.icalUrl);
    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const key in events) {
      if (events.hasOwnProperty(key)) {
        const event = events[key];
        if (event.type !== 'VEVENT') continue;

        try {
          const uid = event.uid;
          const summary = event.summary || 'External Booking';
          const startDate = new Date(event.start as unknown as string);
          const endDate = new Date(event.end as unknown as string);

          if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            continue;
          }

          const existing = await this.bookingsRepo.findOne({ where: { icalUid: uid } });

          if (existing) {
            if (
              existing.startDate.getTime() !== startDate.getTime() ||
              existing.endDate.getTime() !== endDate.getTime()
            ) {
              existing.startDate = startDate;
              existing.endDate = endDate;
              existing.guestName = summary;
              await this.bookingsRepo.save(existing);
              updated++;
            }
          } else {
            const newBooking = this.bookingsRepo.create({
              propertyId: connection.propertyId,
              guestName: summary,
              startDate,
              endDate,
              platform: connection.platform.toUpperCase(),
              status: 'confirmed',
              totalPrice: 0,
              icalUid: uid,
            });
            await this.bookingsRepo.save(newBooking);
            added++;
          }
        } catch (e) {
          errors++;
          this.logger.warn(`Error processing event ${key}: ${e.message}`);
        }
      }
    }

    return {
      added,
      updated,
      errors,
      message: `Sync ${connection.platform}: +${added} added, ${updated} updated`,
    };
  }

  private async syncApi(connection: PlatformConnection) {
    // API sync is platform-specific
    switch (connection.platform) {
      case 'lodgify':
        return this.syncLodgify(connection);
      case 'airbnb':
        return { added: 0, updated: 0, errors: 0, message: 'Airbnb API requires partner access. Use iCal sync instead.' };
      case 'booking_com':
        return { added: 0, updated: 0, errors: 0, message: 'Booking.com API requires partner access. Use iCal sync instead.' };
      default:
        return { added: 0, updated: 0, errors: 0, message: 'API sync not available for this platform' };
    }
  }

  private async syncLodgify(connection: PlatformConnection) {
    if (!connection.apiKey) {
      throw new Error('Lodgify API key not configured');
    }

    this.logger.log(`Syncing Lodgify API for property ${connection.propertyId}`);

    try {
      const headers = {
        'X-ApiKey': connection.apiKey,
        'Accept': 'application/json',
      };

      // Fetch bookings from Lodgify
      const url = connection.externalPropertyId
        ? `https://api.lodgify.com/v2/reservations?property_id=${connection.externalPropertyId}`
        : 'https://api.lodgify.com/v2/reservations';

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Lodgify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const reservations = Array.isArray(data) ? data : data.items || [];

      let added = 0;
      let updated = 0;
      let errors = 0;

      for (const res of reservations) {
        try {
          const uid = `lodgify-${res.id}`;
          const guestName = res.guest?.name || res.guest_name || 'Lodgify Guest';
          const startDate = new Date(res.arrival || res.check_in);
          const endDate = new Date(res.departure || res.check_out);
          const totalPrice = res.total_amount || res.amount || 0;

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) continue;

          const existing = await this.bookingsRepo.findOne({ where: { icalUid: uid } });

          if (existing) {
            existing.startDate = startDate;
            existing.endDate = endDate;
            existing.guestName = guestName;
            existing.totalPrice = totalPrice;
            await this.bookingsRepo.save(existing);
            updated++;
          } else {
            const newBooking = this.bookingsRepo.create({
              propertyId: connection.propertyId,
              guestName,
              startDate,
              endDate,
              platform: 'LODGIFY',
              status: 'confirmed',
              totalPrice,
              icalUid: uid,
            });
            await this.bookingsRepo.save(newBooking);
            added++;
          }
        } catch (e) {
          errors++;
          this.logger.warn(`Error processing Lodgify reservation: ${e.message}`);
        }
      }

      return {
        added,
        updated,
        errors,
        message: `Lodgify sync: +${added} added, ${updated} updated`,
      };
    } catch (error) {
      throw new Error(`Lodgify sync failed: ${error.message}`);
    }
  }

  // ─── SYNC ALL (auto-sync eligible) ─────────────────────

  async syncAllDue(): Promise<{ synced: number; errors: number }> {
    const now = new Date();
    const connections = await this.connectionsRepo.find({
      where: { autoSyncEnabled: true, enabled: true },
    });

    let synced = 0;
    let errors = 0;

    for (const conn of connections) {
      const lastSync = conn.lastSyncAt ? new Date(conn.lastSyncAt) : new Date(0);
      const minutesSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60);

      if (minutesSinceSync >= conn.syncIntervalMinutes) {
        try {
          await this.syncConnection(conn.id, 'auto');
          synced++;
        } catch (e) {
          errors++;
          this.logger.error(`Auto-sync failed for connection ${conn.id}: ${e.message}`);
        }
      }
    }

    return { synced, errors };
  }

  // ─── SYNC LOGS ───────────────────────────────────────────

  async getSyncLogs(connectionId?: string, limit = 50): Promise<SyncLog[]> {
    const where = connectionId ? { connectionId } : {};
    return this.syncLogsRepo.find({
      where,
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  // ─── STATS ───────────────────────────────────────────────

  async getStats() {
    const connections = await this.connectionsRepo.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalConnections = connections.length;
    const activeConnections = connections.filter((c) => c.enabled).length;
    const autoSyncCount = connections.filter((c) => c.autoSyncEnabled).length;
    const syncedToday = connections.filter(
      (c) => c.lastSyncAt && new Date(c.lastSyncAt) >= today,
    ).length;
    const errorCount = connections.filter(
      (c) => c.lastSyncStatus === 'error',
    ).length;

    const platformCounts: Record<string, number> = {};
    connections.forEach((c) => {
      platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
    });

    return {
      totalConnections,
      activeConnections,
      autoSyncCount,
      syncedToday,
      errorCount,
      platformCounts,
    };
  }

  // ─── LODGIFY: TEST KEY ──────────────────────────────────

  async testLodgifyKey(apiKey: string) {
    try {
      const response = await fetch('https://api.lodgify.com/v2/properties', {
        headers: { 'X-ApiKey': apiKey, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        return { valid: false, message: `API returned ${response.status}` };
      }

      const data = await response.json();
      const properties = Array.isArray(data) ? data : data.items || [];

      return {
        valid: true,
        message: `Connected! Found ${properties.length} properties`,
        properties: properties.map((p: any) => ({
          id: p.id,
          name: p.name,
          address: p.address,
        })),
      };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }
}
