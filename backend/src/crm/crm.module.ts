import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { Contact } from './entities/contact.entity';
import { ContactNote } from './entities/contact-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, ContactNote])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
