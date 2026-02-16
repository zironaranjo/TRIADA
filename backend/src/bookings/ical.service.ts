import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import * as ical from 'node-ical';
@Injectable()
export class IcalService {
  private readonly logger = new Logger(IcalService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  /**
   * Detect platform from iCal URL
   */
  private detectPlatform(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('airbnb.com')) return 'AIRBNB';
    if (lower.includes('booking.com')) return 'BOOKING_COM';
    if (lower.includes('vrbo.com') || lower.includes('homeaway.com')) return 'VRBO';
    if (lower.includes('tripadvisor.com')) return 'OTHER';
    return 'OTHER';
  }

  /**
   * Syncs calendar from Airbnb/Booking.com for a specific property
   */
  async syncPropertyCalendar(propertyId: string): Promise<{
    added: number;
    updated: number;
    errors: number;
    message: string;
  }> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    if (!property.icalUrl) {
      return {
        added: 0,
        updated: 0,
        errors: 0,
        message: 'No iCal URL configured for this property',
      };
    }

    this.logger.log(
      `Starting sync for property: ${property.name} (${property.icalUrl})`,
    );

    const platform = this.detectPlatform(property.icalUrl);

    try {
      const events = await ical.async.fromURL(property.icalUrl);
      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const key in events) {
        if (events.hasOwnProperty(key)) {
          const event = events[key];

          if (event.type === 'VEVENT') {
            try {
              const uid = event.uid;
              const summary = event.summary || 'External Booking';
              const startDate = new Date(event.start);
              const endDate = new Date(event.end);

              if (
                !startDate ||
                !endDate ||
                isNaN(startDate.getTime()) ||
                isNaN(endDate.getTime())
              ) {
                continue;
              }

              const existingBooking = await this.bookingsRepository.findOne({
                where: { icalUid: uid },
              });

              if (existingBooking) {
                if (
                  existingBooking.startDate.getTime() !== startDate.getTime() ||
                  existingBooking.endDate.getTime() !== endDate.getTime()
                ) {
                  existingBooking.startDate = startDate;
                  existingBooking.endDate = endDate;
                  existingBooking.guestName = summary;
                  await this.bookingsRepository.save(existingBooking);
                  updatedCount++;
                }
              } else {
                const newBooking = this.bookingsRepository.create({
                  property: property,
                  guestName: summary,
                  startDate: startDate,
                  endDate: endDate,
                  platform: platform,
                  status: 'confirmed',
                  totalPrice: 0,
                  icalUid: uid,
                });
                await this.bookingsRepository.save(newBooking);
                addedCount++;
              }
            } catch (eventError) {
              errorCount++;
              this.logger.warn(`Error processing event ${key}: ${eventError.message}`);
            }
          }
        }
      }

      this.logger.log(
        `Sync complete for ${property.name}. Added: ${addedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`,
      );
      return {
        added: addedCount,
        updated: updatedCount,
        errors: errorCount,
        message: `Sync successful — ${platform}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync calendar for property ${propertyId}`,
        error,
      );
      throw new Error(`Failed to sync: ${error.message}`);
    }
  }

  /**
   * Generate iCal export for a property (all bookings as .ics)
   */
  async generateIcalExport(propertyId: string): Promise<string> {
    const property = await this.propertiesRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const bookings = await this.bookingsRepository.find({
      where: { property: { id: propertyId } },
    });

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TRIADAK//Vacation Rental Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${property.name} — TRIADAK`,
    ];

    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue;

      const start = this.formatIcalDate(new Date(booking.startDate));
      const end = this.formatIcalDate(new Date(booking.endDate));
      const uid = booking.icalUid || `triadak-${booking.id}@triadak.io`;
      const summary = booking.guestName || 'Reserved';
      const now = this.formatIcalDate(new Date());

      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`DTSTAMP:${now}T000000Z`);
      lines.push(`UID:${uid}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`STATUS:CONFIRMED`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private formatIcalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}
