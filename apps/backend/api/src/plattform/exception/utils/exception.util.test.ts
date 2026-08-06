import type { UUID } from 'node:crypto';
import { MinervaError } from '@minerva/typescript-lib';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  type Logger,
  NotFoundException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestWithRequestId } from '../../request-id/interface/request-id.interface';
import { HttpRequestError, UnexpectedError } from '../errors/request.errors';
import { captureError, logError, toErrorResponse, toMinervaError, toRequestId } from './exception.util';

const REQUEST_ID = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31' as UUID;

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** The 32 hex characters Sentry answers a capture with, and names the issue by. */
const EVENT_ID = 'b1c4d2e3f4a5b6c7d8e9f0a1b2c3d4e5';

/* The real `captureException` would queue an envelope for a DSN no test has. It
   still has to answer with an id, since that is what ends up in the log line. */
vi.mock('@sentry/nestjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Sentry>()),
  captureException: vi.fn(() => EVENT_ID),
}));

/** A `MinervaError` with whatever the case under test needs to differ in. */
function buildError(properties: Partial<ConstructorParameters<typeof MinervaError>[0]> = {}): MinervaError {
  return new MinervaError({
    reference: '00000000-0000-4000-8000-000000000000',
    code: 'ERR_001',
    message: 'Something specific went wrong.',
    ...properties,
  });
}

/** A request cut down to the parts {@link captureError} reads its tags from. */
function buildRequest(properties: Partial<RequestWithRequestId> = {}): Partial<RequestWithRequestId> {
  return {
    method: 'get',
    url: '/invoices/inv_1?draft=true',
    route: { path: '/invoices/:invoiceId' },
    ...properties,
  };
}

/** The five `Logger` methods {@link logError} is allowed to reach for. */
function buildLogger(): Logger {
  return { log: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() } as unknown as Logger;
}

describe('toMinervaError', () => {
  it('hands a MinervaError back untouched, so the throw site keeps its say', () => {
    const error = buildError();

    expect(toMinervaError(error)).toBe(error);
  });

  it('wraps a Nest exception, keeping the status it was thrown with', () => {
    const error = toMinervaError(new NotFoundException('No such invoice'));

    expect(error).toBeInstanceOf(HttpRequestError);
    expect(error.code).toBe('ERR_002');
    expect(error.status).toBe(404);
  });

  it('reads a client fault as a warning, so a mistyped URL is not an incident', () => {
    expect(toMinervaError(new BadRequestException()).logLevel).toBe('warn');
    expect(toMinervaError(new ForbiddenException()).logLevel).toBe('warn');
  });

  it('reads a 5xx Nest exception as an error, because that one is ours', () => {
    expect(toMinervaError(new InternalServerErrorException()).logLevel).toBe('error');
  });

  it('keeps what Nest put in the exception body, which is where a validation report lives', () => {
    const error = toMinervaError(new BadRequestException(['name must be a string']));

    expect(error.payload).toMatchObject({
      exception: 'BadRequestException',
      detail: expect.objectContaining({ message: ['name must be a string'] }),
    });
  });

  it('wraps anything else as the bug it is', () => {
    const cause = new TypeError('cannot read properties of undefined');
    const error = toMinervaError(cause);

    expect(error).toBeInstanceOf(UnexpectedError);
    expect(error.code).toBe('ERR_003');
    expect(error.status).toBe(500);
    expect(error.logLevel).toBe('error');
    expect(error.cause).toBe(cause);
  });

  it('describes a thrown non-error rather than losing it, since anything can be thrown', () => {
    const error = toMinervaError({ reason: 'a plain object was thrown' });

    expect(error.cause).toBeUndefined();
    expect(error.payload?.thrown).toContain('a plain object was thrown');
  });

  it('says nothing it does not know when the throw carried no value at all', () => {
    expect(toMinervaError(undefined).payload).toBeUndefined();
  });
});

describe('toRequestId', () => {
  it('takes the id the middleware settled, which is what joins the answer to the request', () => {
    expect(toRequestId({ requestId: REQUEST_ID } as RequestWithRequestId)).toBe(REQUEST_ID);
  });

  it('mints one when the request never reached the middleware', () => {
    expect(toRequestId({})).toMatch(UUID_PATTERN);
  });

  it('mints one when there is no request at all, so the filter cannot fail on the failure', () => {
    expect(toRequestId(undefined)).toMatch(UUID_PATTERN);
  });
});

describe('toErrorResponse', () => {
  it('always answers with what identifies the failure', () => {
    const error = buildError();
    const response = toErrorResponse({ error, requestId: REQUEST_ID, isProduction: true });

    expect(response).toMatchObject({
      name: 'MinervaError',
      code: 'ERR_001',
      reference: '00000000-0000-4000-8000-000000000000',
      requestId: REQUEST_ID,
      date: expect.any(String),
    });
  });

  it('dates the answer in UTC, so two clocks can be compared', () => {
    expect(toErrorResponse({ error: buildError(), requestId: REQUEST_ID, isProduction: true }).date).toMatch(/Z$/);
  });

  it('shows the message and the payload outside production, where a developer is reading', () => {
    const error = buildError({ payload: { invoiceId: 'inv_1' } });
    const response = toErrorResponse({ error, requestId: REQUEST_ID, isProduction: false });

    expect(response.message).toBe('Something specific went wrong.');
    expect(response.payload).toEqual({ invoiceId: 'inv_1' });
  });

  it('withholds both in production, because neither was written for a user', () => {
    const error = buildError({ payload: { invoiceId: 'inv_1' } });
    const response = toErrorResponse({ error, requestId: REQUEST_ID, isProduction: true });

    expect(response.message).toBeUndefined();
    expect(response.payload).toBeUndefined();
  });

  it('leaks nothing through a payload key in production, whatever the throw site attached', () => {
    const error = buildError({ payload: { cookieSecret: 'a-test-secret-of-more-than-32-characters' } });

    expect(JSON.stringify(toErrorResponse({ error, requestId: REQUEST_ID, isProduction: true }))).not.toContain(
      'a-test-secret',
    );
  });
});

describe('captureError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['error', 'fatal'] as const)('opens an issue for a %s and answers with its id', (logLevel) => {
    expect(captureError({ error: buildError({ logLevel }), requestId: REQUEST_ID, request: buildRequest() })).toBe(
      EVENT_ID,
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it.each(['log', 'info', 'debug', 'warn'] as const)('stays out of Sentry for a %s, and says so', (logLevel) => {
    expect(
      captureError({ error: buildError({ logLevel }), requestId: REQUEST_ID, request: buildRequest() }),
    ).toBeNull();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('groups by throw site rather than message, so one site stays one issue', () => {
    const error = buildError({ logLevel: 'error' });

    captureError({ error, requestId: REQUEST_ID, request: buildRequest() });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fingerprint: ['ERR_001', error.reference] }),
    );
  });

  it('indexes what an incident is searched by, and files the rest as extra', () => {
    const error = buildError({ logLevel: 'fatal', payload: { issues: ['API_PORT must be a number'] } });

    captureError({ error, requestId: REQUEST_ID, request: buildRequest() });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        level: 'fatal',
        tags: expect.objectContaining({ code: 'ERR_001', reference: error.reference, requestId: REQUEST_ID }),
        extra: { issues: ['API_PORT must be a number'] },
      }),
    );
  });

  it('names the endpoint by its pattern, so one route stays one search rather than one per id', () => {
    captureError({ error: buildError({ logLevel: 'error' }), requestId: REQUEST_ID, request: buildRequest() });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tags: expect.objectContaining({
          method: 'GET',
          route: '/invoices/:invoiceId',
          url: '/invoices/inv_1?draft=true',
        }),
      }),
    );
  });

  it('reports the method as Express did not, since a tag is matched exactly', () => {
    const request = buildRequest({ method: 'post' });

    captureError({ error: buildError({ logLevel: 'error' }), requestId: REQUEST_ID, request });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tags: expect.objectContaining({ method: 'POST' }) }),
    );
  });

  it('sets every tag even for a request that answered none of them, so a filter never hides an issue', () => {
    captureError({ error: buildError({ logLevel: 'error' }), requestId: REQUEST_ID, request: {} });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tags: expect.objectContaining({ method: '<unknown>', route: '<unknown>', url: '<unknown>' }),
      }),
    );
  });

  it('still reports when there is no request at all, rather than failing on the failure', () => {
    expect(captureError({ error: buildError({ logLevel: 'error' }), requestId: REQUEST_ID })).toBe(EVENT_ID);
  });
});

describe('logError', () => {
  it.each([
    ['log', 'log'],
    ['info', 'log'],
    ['debug', 'debug'],
    ['warn', 'warn'],
    ['error', 'error'],
    ['fatal', 'fatal'],
  ] as const)('prints a %s through the logger method named %s', (logLevel, method) => {
    const logger = buildLogger();

    logError({ logger, error: buildError({ logLevel }), requestId: REQUEST_ID, eventId: EVENT_ID });

    expect(logger[method]).toHaveBeenCalledOnce();
  });

  it('writes one parseable line, not a rendered error', () => {
    const logger = buildLogger();
    const error = buildError({ logLevel: 'error', payload: { invoiceId: 'inv_1' } });

    logError({ logger, error, requestId: REQUEST_ID, eventId: EVENT_ID });

    const [line] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(JSON.parse(String(line))).toMatchObject({
      requestId: REQUEST_ID,
      code: 'ERR_001',
      message: 'Something specific went wrong.',
      payload: { invoiceId: 'inv_1' },
    });
  });

  it('names the Sentry issue it belongs to, so the console and Sentry can be walked either way', () => {
    const logger = buildLogger();

    logError({ logger, error: buildError({ logLevel: 'error' }), requestId: REQUEST_ID, eventId: EVENT_ID });

    expect(JSON.parse(String(vi.mocked(logger.error).mock.calls[0]?.[0]))).toMatchObject({ eventId: EVENT_ID });
  });

  it('prints a null event id rather than omitting it, because unsent is not the same as lost', () => {
    const logger = buildLogger();

    logError({ logger, error: buildError({ logLevel: 'warn' }), requestId: REQUEST_ID, eventId: null });

    expect(JSON.parse(String(vi.mocked(logger.warn).mock.calls[0]?.[0]))).toMatchObject({ eventId: null });
  });

  it('keeps the message and the payload the response withheld, which is the point of the log', () => {
    const logger = buildLogger();
    const cause = new Error('the driver gave up');

    logError({ logger, error: new UnexpectedError(cause), requestId: REQUEST_ID, eventId: EVENT_ID });

    const [line] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(JSON.parse(String(line))).toMatchObject({
      stack: expect.stringContaining('UnexpectedError'),
      cause: { name: 'Error', message: 'the driver gave up' },
    });
  });
});
