import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { MinervaExceptionFilter } from './filter/exception.filter';

/**
 * Puts `MinervaExceptionFilter` behind every route in the api.
 *
 * `APP_FILTER` rather than `app.useGlobalFilters`, because the filter takes
 * `EnvironmentService` and only a provider is resolved through the container.
 *
 * @see https://docs.nestjs.com/exception-filters#binding-filters
 */
@Module({
  providers: [{ provide: APP_FILTER, useClass: MinervaExceptionFilter }],
})
export class ExceptionModule {}
