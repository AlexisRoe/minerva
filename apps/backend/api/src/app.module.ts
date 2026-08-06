import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';

import { HealthModule } from './modules/health/health.module';
import { ManagerModule } from './modules/manager/manager.module';
import { ReporterModule } from './modules/reporter/reporter.module';
import { SDKModule } from './modules/sdk/sdk.module';
import { EnvironmentModule } from './plattform/environment/environment.module';
import { ExceptionModule } from './plattform/exception/exception.module';
import { RequestIdModule } from './plattform/request-id/request-id.module';

/** `SentryModule.forRoot()` wires the tracing only; `ExceptionModule` reports. */
@Module({
  imports: [
    SentryModule.forRoot(),
    EnvironmentModule,
    RequestIdModule,
    ExceptionModule,
    HealthModule,
    ReporterModule,
    ManagerModule,
    SDKModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
