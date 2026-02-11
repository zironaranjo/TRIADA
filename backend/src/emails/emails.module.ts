import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService], // In case we use it in other modules
})
export class EmailsModule {}
