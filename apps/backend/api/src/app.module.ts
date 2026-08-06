import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { HealthModule } from './modules/health/health.module';
import { ManagerModule } from './modules/manager/manager.module';
import { ReporterModule } from './modules/reporter/reporter.module';
import { SDKModule } from './modules/sdk/sdk.module';
import { EnvironmentModule } from './plattform/environment/environment.module';
import { RequestIdModule } from './plattform/request-id/request-id.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    EnvironmentModule,
    RequestIdModule,
    HealthModule,
    ReporterModule,
    ManagerModule,
    SDKModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
