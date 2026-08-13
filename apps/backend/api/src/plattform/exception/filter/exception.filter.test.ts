import type { UUID } from 'node:crypto';
import { MinervaError } from '@minerva/typescript-lib';
import type { ArgumentsHost } from '@nestjs/common';
import { Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EnvironmentService } from '../../environment/service/environment.service';
import type { RequestWithRequestId } from '../../request-id/interface/request-id.interface';
import type { ErrorResponse } from '../interfaces/exception.response';
import { MinervaExceptionFilter } from './exception.filter';

const REQUEST_ID = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31' as UUID;

/** The 32 hex characters Sentry answers a capture with, and names the issue by. */
const EVENT_ID = 'b1c4d2e3f4a5b6c7d8e9f0a1b2c3d4e5';

/* The real `captureException` would queue an envelope for a DSN no test has. It
   still has to answer with an id, since that is what ends up in the log line. */
vi.mock('@sentry/nestjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Sentry>()),
  captureException: vi.fn(() => EVENT_ID),
}));

/** The filter's own `Logger`, muted so the deliberate throws stay off stdout. */
const logged = {
  warn: vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
  error: vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
};

/**
 * The two arguments Nest passes, cut down to what the filter touches. `status`
 * returns the response, so `.status().json()` chains the way Express's does.
 */
function buildHost(
  request: Partial<RequestWithRequestId> = {
    requestId: REQUEST_ID,
    method: 'get',
    url: '/invoices/inv_1',
    route: { path: '/invoices/:invoiceId' },
  },
) {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

  const host = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

/** The filter with a stage decided, since production is what changes the body. */
function buildFilter(isProduction = false): MinervaExceptionFilter {
  return new MinervaExceptionFilter({ isProduction } as EnvironmentService);
}

/** The body the filter handed to `json`, typed. */
function readBody(response: ReturnType<typeof buildHost>['response']): ErrorResponse {
  const [body] = vi.mocked(response.json).mock.calls[0] ?? [];

  return body as ErrorResponse;
}

describe('MinervaExceptionFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is resolvable through the container, which is what gives it the environment', async () => {
    const moduleReference = await Test.createTestingModule({ providers: [MinervaExceptionFilter] })
      .useMocker((token) => (token === EnvironmentService ? { isProduction: false } : undefined))
      .compile();

    expect(moduleReference.get(MinervaExceptionFilter)).toBeInstanceOf(MinervaExceptionFilter);
  });

  it('answers a MinervaError with the status it was thrown with', () => {
    const { host, response } = buildHost();

    buildFilter().catch(
      new MinervaError({
        reference: '00000000-0000-4000-8000-000000000000',
        code: 'ERR_001',
        message: 'Something specific went wrong.',
        status: 409,
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(readBody(response)).toMatchObject({ name: 'MinervaError', code: 'ERR_001' });
  });

  it('answers a Nest exception with its own status, under a Minerva code', () => {
    const { host, response } = buildHost();

    buildFilter().catch(new NotFoundException(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(readBody(response)).toMatchObject({ name: 'HttpRequestError', code: 'ERR_002' });
  });

  it('answers anything else with a 500, rather than leaking that it did not recognise it', () => {
    const { host, response } = buildHost();

    buildFilter().catch(new TypeError('cannot read properties of undefined'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(readBody(response)).toMatchObject({ name: 'UnexpectedError', code: 'ERR_003' });
  });

  it('answers all three in the same shape, so a client needs one branch', () => {
    const keys = [
      new MinervaError({ reference: '00000000-0000-4000-8000-000000000000', code: 'ERR_001', message: 'a' }),
      new NotFoundException(),
      'a string was thrown',
    ].map((exception) => {
      const { host, response } = buildHost();
      buildFilter().catch(exception, host);

      return Object.keys(readBody(response)).sort();
    });

    expect(keys[0]).toEqual(['code', 'date', 'message', 'name', 'payload', 'reference', 'requestId']);
    expect(keys[1]).toEqual(keys[0]);
    expect(keys[2]).toEqual(keys[0]);
  });

  it('names the request in the body, so a report and a log line can be joined', () => {
    const { host, response } = buildHost();

    buildFilter().catch(new NotFoundException(), host);

    expect(readBody(response).requestId).toBe(REQUEST_ID);
  });

  it('still answers when no middleware settled an id, instead of failing on the failure', () => {
    const { host, response } = buildHost({});

    buildFilter().catch(new NotFoundException(), host);

    expect(readBody(response).requestId).toEqual(expect.any(String));
    expect(response.json).toHaveBeenCalledOnce();
  });

  it('withholds the message and the payload in production', () => {
    const { host, response } = buildHost();

    buildFilter(true).catch(new NotFoundException('No such invoice'), host);

    expect(readBody(response).message).toBeUndefined();
    expect(readBody(response).payload).toBeUndefined();
  });

  it('reports a bug to Sentry, because nobody else will', () => {
    const { host } = buildHost();

    buildFilter().catch(new TypeError('cannot read properties of undefined'), host);

    expect(Sentry.captureException).toHaveBeenCalledOnce();
  });

  it('hands the request over, so the issue is searchable by the endpoint that raised it', () => {
    const { host } = buildHost();

    buildFilter().catch(new TypeError('boom'), host);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tags: expect.objectContaining({ method: 'GET', route: '/invoices/:invoiceId', requestId: REQUEST_ID }),
      }),
    );
  });

  it('keeps a 404 out of Sentry, which is what the SentryGlobalFilter would not have done', () => {
    const { host } = buildHost();

    buildFilter().catch(new NotFoundException(), host);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('answers even for a failure it reported, so reporting is never the client-visible step', () => {
    const { host, response } = buildHost();

    buildFilter().catch(new TypeError('boom'), host);

    expect(response.json).toHaveBeenCalledOnce();
  });

  it('logs what Sentry was not told, at the level the error asked for', () => {
    const { host } = buildHost();

    buildFilter().catch(new NotFoundException('No such invoice'), host);

    expect(logged.error).not.toHaveBeenCalled();
    expect(JSON.parse(String(logged.warn.mock.calls[0]?.[0]))).toMatchObject({
      requestId: REQUEST_ID,
      code: 'ERR_002',
      message: 'No such invoice',
    });
  });

  it('quotes the id of the issue it opened, which is what capturing before logging buys', () => {
    const { host } = buildHost();

    buildFilter().catch(new TypeError('cannot read properties of undefined'), host);

    expect(JSON.parse(String(logged.error.mock.calls[0]?.[0]))).toMatchObject({ eventId: EVENT_ID });
  });

  it('records that a 404 was seen and deliberately not sent, rather than leaving it unexplained', () => {
    const { host } = buildHost();

    buildFilter().catch(new NotFoundException(), host);

    expect(JSON.parse(String(logged.warn.mock.calls[0]?.[0]))).toMatchObject({ eventId: null });
  });

  it('logs the message and the payload production withheld from the body', () => {
    const { host, response } = buildHost();

    buildFilter(true).catch(new TypeError('cannot read properties of undefined'), host);

    expect(readBody(response).message).toBeUndefined();
    expect(JSON.parse(String(logged.error.mock.calls[0]?.[0]))).toMatchObject({
      message: 'Minerva could not complete this request.',
      cause: { name: 'TypeError', message: 'cannot read properties of undefined' },
    });
  });
});
