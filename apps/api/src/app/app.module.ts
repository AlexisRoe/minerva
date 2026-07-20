import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { validateEnv } from '../config/env';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { HealthModule } from '../health/health.module';
import { ImagesModule } from '../images/images.module';
import { StorageModule } from '../storage/storage.module';
import { ValkeyModule } from '../valkey/valkey.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    ValkeyModule,
    StorageModule,
    HealthModule,
    EventsModule,
    ImagesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
