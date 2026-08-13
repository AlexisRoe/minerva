import { randomUUID, type UUID } from 'node:crypto';
import { convertToSentryLevel, type ErrorLogLevel, MinervaError, NEST_LOGGER_METHOD } from '@minerva/typescript-lib';
import { HttpException, type Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { RequestWithRequestId } from '../../request-id/interface/request-id.interface';
import { HttpRequestError, UnexpectedError } from '../errors/request.errors';
import type { ErrorResponse } from '../interfaces/exception.response';

/** The levels worth an issue in Sentry; everything quieter is the caller's fault or routine. */
const CAPTURED_LEVELS: ReadonlySet<ErrorLogLevel> = new Set<ErrorLogLevel>(['error', 'fatal']);

/** Stands in for a tag the request could not answer for, so every issue carries the same keys. */
const UNKNOWN_TAG = '<unknown>';

/**
 * Turns whatever was thrown into a `MinervaError` -- the filter's three paths.
 *
 * A `MinervaError` passes through untouched, an `HttpException` is wrapped in
 * `HttpRequestError` keeping its status, anything else in `UnexpectedError`.
 *
 * @example
 * ```ts
 * const error = toMinervaError(new NotFoundException('No such invoice'));
 * // -> HttpRequestError, code ERR_002, status 404, logLevel 'warn'
 * ```
 */
export function toMinervaError(exception: unknown): MinervaError {
  if (MinervaError.is(exception)) {
    return exception;
  }

  if (exception instanceof HttpException) {
    return new HttpRequestError(exception);
  }

  return new UnexpectedError(exception);
}

/**
 * The id of the request that failed, minting one if `RequestIdMiddleware` never
 * ran -- a minted id still joins the response to the log line written for it.
 *
 * @example
 * ```ts
 * const requestId = toRequestId(host.switchToHttp().getRequest());
 * ```
 */
export function toRequestId(request: Partial<RequestWithRequestId> | undefined): UUID {
  return request?.requestId ?? randomUUID();
}

/** What {@link toErrorResponse} needs to decide what the client is told. */
export interface ErrorResponseInput {
  /** The error the filter settled on. */
  error: MinervaError;
  /** The id of the request that failed. */
  requestId: UUID;
  /** Whether this is the production stage, where `message` and `payload` are dropped. */
  isProduction: boolean;
}

/**
 * Builds the body the client receives.
 *
 * `message` and `payload` are written for a developer and are dropped in
 * production; they stay in the log line and the Sentry issue, which
 * `reference` and `requestId` lead back to.
 *
 * @example
 * ```ts
 * toErrorResponse({ error: new UnexpectedError(cause), requestId, isProduction: true });
 * // -> { name, code, reference, requestId, date }  -- no message, no payload
 * ```
 */
export function toErrorResponse({ error, requestId, isProduction }: ErrorResponseInput): ErrorResponse {
  return {
    name: error.name,
    code: error.code,
    reference: error.reference,
    requestId,
    date: new Date().toISOString(),
    message: isProduction ? undefined : error.message,
    payload: isProduction ? undefined : error.payload,
  };
}

/** What {@link captureError} reports, and indexes the issue by. */
export interface CaptureErrorInput {
  /** The error the filter settled on. */
  error: MinervaError;
  /** The id of the request that failed. */
  requestId: UUID;
  /** The request that failed, absent when the failure reached the filter without one. */
  request?: Partial<RequestWithRequestId>;
}

/**
 * Opens a Sentry issue for the error, and answers with its event id.
 *
 * Only `error` and `fatal` are captured; anything quieter is the caller's fault
 * and would bury them, so it returns `null` and stays on the console alone.
 * Grouping is by `[code, reference]`, so one throw site is one issue however the
 * message is later reworded. The request tags are what Sentry does not index by
 * itself -- `route` is the pattern, so one endpoint stays one search.
 *
 * @example
 * ```ts
 * captureError({ error: new UnexpectedError(cause), requestId, request });   // -> 'b1c4…'
 * captureError({ error: new HttpRequestError(new NotFoundException()), requestId, request });   // -> null
 * ```
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/usage/
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/usage/sdk-fingerprinting/
 */
export function captureError({ error, request, requestId }: CaptureErrorInput): string | null {
  if (!CAPTURED_LEVELS.has(error.logLevel)) {
    return null;
  }

  const { code, reference } = error;

  return Sentry.captureException(error, {
    level: convertToSentryLevel(error.logLevel),
    tags: {
      code,
      reference,
      requestId,
      method: request?.method?.toUpperCase() ?? UNKNOWN_TAG,
      route: request?.route?.path ?? UNKNOWN_TAG,
      url: request?.url ?? UNKNOWN_TAG,
    },
    extra: error.payload,
    fingerprint: [code, reference],
  });
}

/** What {@link logError} writes into the one line a failure gets. */
export interface LogErrorInput {
  /** The logger to print through, which names the line's context. */
  logger: Logger;
  /** The error the filter settled on. */
  error: MinervaError;
  /** The id of the request that failed. */
  requestId: UUID;
  /** The Sentry event id {@link captureError} answered with, `null` when it did not capture. */
  eventId: string | null;
}

/**
 * Writes the one JSON line this failure gets, at the level the error asked for.
 *
 * Unlike the response body this keeps the whole error, production included.
 * `JSON.stringify` picks up `MinervaError#toJSON` for the message, stack,
 * payload and cause, which a plain stringify of an `Error` would all drop.
 *
 * @example
 * ```ts
 * logError({ logger, error, requestId, eventId });
 * // ERROR [MinervaExceptionFilter] {"requestId":"3f1c…","eventId":"b1c4…","name":"UnexpectedError",…}
 * ```
 */
export function logError({ logger, error, requestId, eventId }: LogErrorInput): void {
  const level = NEST_LOGGER_METHOD[error.logLevel];
  const payload = JSON.stringify({ requestId, eventId, ...error.toJSON() });

  logger[level](payload);
}
