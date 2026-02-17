import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { PlatformConnection } from './entities/platform-connection.entity';
import { SyncLog } from './entities/sync-log.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Property } from '../properties/entities/property.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PlatformConnection, SyncLog, Booking, Property]),
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
