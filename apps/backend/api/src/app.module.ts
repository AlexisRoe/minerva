import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [SentryModule.forRoot(), HealthModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
