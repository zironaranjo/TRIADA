import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.enableCors({
    origin: true, // Allow all origins (or specify: ['https://triadak.io', 'https://www.triadak.io'])
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const dbUrl = process.env.DATABASE_URL;
  console.log(`🔍 DIAGNOSTIC: DATABASE_URL is ${dbUrl ? 'Present' : 'MISSING'}`);
  if (dbUrl) {
    console.log(`🔍 DIAGNOSTIC: URL length: ${dbUrl.length}, Starts with: ${dbUrl.substring(0, 10)}`);
  } else {
    console.error('❌ CRITICAL: DATABASE_URL environment variable is not set!');
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 TRIADA Backend running on: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
