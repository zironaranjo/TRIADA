import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  // ─── CONNECTIONS CRUD ────────────────────────────────────

  @Get('connections')
  getConnections(@Query('propertyId') propertyId?: string) {
    if (propertyId) {
      return this.channelsService.findConnectionsByProperty(propertyId);
    }
    return this.channelsService.findAllConnections();
  }

  @Get('connections/:id')
  getConnection(@Param('id') id: string) {
    return this.channelsService.findConnectionById(id);
  }

  @Post('connections')
  createConnection(@Body() body: any) {
    return this.channelsService.createConnection(body);
  }

  @Put('connections/:id')
  updateConnection(@Param('id') id: string, @Body() body: any) {
    return this.channelsService.updateConnection(id, body);
  }

  @Delete('connections/:id')
  deleteConnection(@Param('id') id: string) {
    return this.channelsService.deleteConnection(id);
  }

  // ─── SYNC ────────────────────────────────────────────────

  @Post('connections/:id/sync')
  syncConnection(@Param('id') id: string) {
    return this.channelsService.syncConnection(id, 'manual');
  }

  @Post('sync-all')
  syncAllDue() {
    return this.channelsService.syncAllDue();
  }

  // ─── SYNC LOGS ───────────────────────────────────────────

  @Get('sync-logs')
  getSyncLogs(
    @Query('connectionId') connectionId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.channelsService.getSyncLogs(
      connectionId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ─── STATS ───────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.channelsService.getStats();
  }

  // ─── LODGIFY ─────────────────────────────────────────────

  @Post('lodgify/test')
  testLodgifyKey(@Body('apiKey') apiKey: string) {
    return this.channelsService.testLodgifyKey(apiKey);
  }
}
