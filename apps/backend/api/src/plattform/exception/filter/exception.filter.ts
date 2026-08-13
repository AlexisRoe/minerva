import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';

import { EnvironmentService } from '../../environment/service/environment.service';
import type { RequestWithRequestId } from '../../request-id/interface/request-id.interface';
import type { ErrorResponse } from '../interfaces/exception.response';
import { captureError, logError, toErrorResponse, toMinervaError, toRequestId } from '../utils/exception.util';

/**
 * The last thing that runs on a failed request: reports it, logs it, answers it.
 *
 * `@Catch()` with no argument takes everything, so no failure reaches Nest's
 * built-in filter. `toMinervaError` normalises the three kinds into one error,
 * which then decides the status, the body, the Sentry level and the log level.
 *
 * It replaces Sentry's `SentryGlobalFilter`, which answers in its own shape and
 * reports every `HttpException` including the 404s. `@SentryExceptionCaptured`
 * is unused for the same reason: it captures the raw exception, before it has a
 * code or a fingerprint.
 *
 * @see https://docs.nestjs.com/exception-filters#catch-everything
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/#use-a-custom-global-filter
 */
@Catch()
export class MinervaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MinervaExceptionFilter.name);

  constructor(private readonly environment: EnvironmentService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Partial<RequestWithRequestId>>();
    const response = context.getResponse<Response<ErrorResponse>>();

    const error = toMinervaError(exception);
    const requestId = toRequestId(request);

    const eventId = captureError({ error, request, requestId });
    logError({ logger: this.logger, error, requestId, eventId });

    response
      .status(error.status)
      .json(toErrorResponse({ error, requestId, isProduction: this.environment.isProduction }));
  }
}
