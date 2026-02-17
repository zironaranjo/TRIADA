import { Controller, Get, Post, Body, Param, Header } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { IcalService } from './ical.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly icalService: IcalService,
  ) {}

  @Post('sync/:propertyId')
  syncCalendar(@Param('propertyId') propertyId: string) {
    return this.icalService.syncPropertyCalendar(propertyId);
  }

  @Get('ical/:propertyId')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async exportIcal(
    @Param('propertyId') propertyId: string,
  ): Promise<string> {
    return this.icalService.generateIcalExport(propertyId);
  }

  @Post()
  create(@Body() createBookingDto: any) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('guest/:token')
  async getGuestPortal(@Param('token') token: string) {
    const data = await this.bookingsService.findByGuestToken(token);
    if (!data) {
      return { error: 'Booking not found or guest portal disabled' };
    }
    return data;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}
