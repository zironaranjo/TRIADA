import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OwnersModule } from './owners/owners.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { AccountingModule } from './accounting/accounting.module';
import { CrmModule } from './crm/crm.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DATABASE_TYPE');

        if (dbType === 'sqlite') {
          return {
            type: 'better-sqlite3',
            database: configService.get<string>('DATABASE_PATH') || './triada.db',
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: true, // Re-enable once to create missing tables
          ssl: { rejectUnauthorized: false },
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
      inject: [ConfigService],
    }),
    OwnersModule,
    PropertiesModule,
    BookingsModule,
    AccountingModule,
    CrmModule,
    PaymentsModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
