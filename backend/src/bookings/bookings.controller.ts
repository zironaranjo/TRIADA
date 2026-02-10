import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';

import { IcalService } from './ical.service';

@Controller('bookings')
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly icalService: IcalService
    ) { }

    @Post('sync/:propertyId')
    syncCalendar(@Param('propertyId') propertyId: string) {
        return this.icalService.syncPropertyCalendar(propertyId);
    }

    @Post()
    create(@Body() createBookingDto: any) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findAll() {
        return this.bookingsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }
}
