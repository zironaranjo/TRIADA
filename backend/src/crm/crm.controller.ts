import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ─── Contacts ─────────────────────────────────────

  @Get('contacts')
  getContacts(
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
  ) {
    return this.crmService.findAll({ type, source, search });
  }

  @Get('stats')
  getStats() {
    return this.crmService.getStats();
  }

  @Get('contacts/:id')
  getContact(@Param('id') id: string) {
    return this.crmService.findOne(id);
  }

  @Post('contacts')
  createContact(@Body() data: any) {
    return this.crmService.create(data);
  }

  @Patch('contacts/:id')
  updateContact(@Param('id') id: string, @Body() data: any) {
    return this.crmService.update(id, data);
  }

  @Delete('contacts/:id')
  deleteContact(@Param('id') id: string) {
    return this.crmService.remove(id);
  }

  // ─── Notes ────────────────────────────────────────

  @Get('contacts/:id/notes')
  getNotes(@Param('id') id: string) {
    return this.crmService.getNotes(id);
  }

  @Post('contacts/:id/notes')
  addNote(@Param('id') id: string, @Body() data: any) {
    return this.crmService.addNote(id, data);
  }
}
