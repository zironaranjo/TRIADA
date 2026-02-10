import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Property } from '../properties/entities/property.entity';
import * as ical from 'node-ical';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IcalService {
    private readonly logger = new Logger(IcalService.name);

    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
    ) { }

    /**
     * Syncs calendar from Airbnb/Booking.com for a specific property
     */
    async syncPropertyCalendar(propertyId: string): Promise<{ added: number, updated: number, errors: number, message: string }> {
        const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });

        if (!property) {
            throw new Error('Property not found');
        }

        if (!property.icalUrl) {
            return { added: 0, updated: 0, errors: 0, message: 'No iCal URL configured for this property' };
        }

        this.logger.log(`Starting sync for property: ${property.name} (${property.icalUrl})`);

        try {
            // Fetch and parse iCal data
            const events = await ical.async.fromURL(property.icalUrl);
            let addedCount = 0;
            let updatedCount = 0;

            // Iterate over events
            for (const key in events) {
                if (events.hasOwnProperty(key)) {
                    const event = events[key];

                    if (event.type === 'VEVENT') {
                        // Skip cancelled or past events if needed, but keeping history is good.
                        // We mainly care about future bookings for blocking availability.

                        const uid = event.uid;
                        const summary = event.summary || 'External Booking';
                        const startDate = new Date(event.start);
                        const endDate = new Date(event.end);

                        // Basic validation
                        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            continue;
                        }

                        // Check if booking exists
                        const existingBooking = await this.bookingsRepository.findOne({
                            where: { icalUid: uid }
                        });

                        if (existingBooking) {
                            // Update if dates changed
                            if (existingBooking.startDate.getTime() !== startDate.getTime() ||
                                existingBooking.endDate.getTime() !== endDate.getTime()) {

                                existingBooking.startDate = startDate;
                                existingBooking.endDate = endDate;
                                existingBooking.guestName = summary;
                                // Reset status if it was cancelled before? For now just update dates.
                                await this.bookingsRepository.save(existingBooking);
                                updatedCount++;
                            }
                        } else {
                            // Create new external booking
                            const newBooking = this.bookingsRepository.create({
                                property: property,
                                guestName: summary, // Usually "Airbnb (Not available)" or guest name if provided
                                startDate: startDate,
                                endDate: endDate,
                                platform: 'AIRBNB', // Default to Airbnb for now, logic could be smarter based on URL
                                status: 'CONFIRMED',
                                totalPrice: 0, // We don't know the price from iCal usually
                                icalUid: uid
                            });
                            await this.bookingsRepository.save(newBooking);
                            addedCount++;
                        }
                    }
                }
            }

            this.logger.log(`Sync complete. Added: ${addedCount}, Updated: ${updatedCount}`);
            return { added: addedCount, updated: updatedCount, errors: 0, message: 'Sync successful' };

        } catch (error) {
            this.logger.error(`Failed to sync calendar for property ${propertyId}`, error);
            throw new Error(`Failed to sync: ${error.message}`);
        }
    }
}
