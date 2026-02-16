import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectService } from './connect.service';
import { ConnectController } from './connect.controller';
import { StripeConnectAccount } from './entities/stripe-connect-account.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([StripeConnectAccount])],
  controllers: [ConnectController],
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}
