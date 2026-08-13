import { Test } from '@nestjs/testing';
import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { REQUEST_ID_HEADER } from '../../../constants/request.constants';
import type { RequestWithRequestId } from '../interface/request-id.interface';
import { RequestIdMiddleware } from './request-id.middleware';

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * The three arguments Express would pass, cut down to what the middleware
 * touches.
 *
 * `header` is a function rather than a `headers` record because that is the
 * lookup the middleware performs, and Express's own is case-insensitive -- a
 * fake built out of a plain object would quietly answer `undefined` for the
 * lowercased header a real client sends.
 */
function buildContext(incoming?: string): {
  request: RequestWithRequestId;
  response: Response;
  next: NextFunction;
} {
  const header = vi.fn((name: string) =>
    name.toLowerCase() === REQUEST_ID_HEADER.toLowerCase() ? incoming : undefined,
  );

  return {
    request: { header } as unknown as RequestWithRequestId,
    response: { setHeader: vi.fn() } as unknown as Response,
    next: vi.fn(),
  };
}

describe('RequestIdMiddleware', () => {
  it('is resolvable through the container, which is what lets it take dependencies later', async () => {
    const moduleReference = await Test.createTestingModule({ providers: [RequestIdMiddleware] }).compile();

    expect(moduleReference.get(RequestIdMiddleware)).toBeInstanceOf(RequestIdMiddleware);
  });

  it('carries a usable incoming id through, so the caller keeps the trace it started', () => {
    const incoming = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31';
    const { request, response, next } = buildContext(incoming);

    new RequestIdMiddleware().use(request, response, next);

    expect(request.requestId).toBe(incoming);
    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, incoming);
  });

  it('mints one when the caller sent none', () => {
    const { request, response, next } = buildContext();

    new RequestIdMiddleware().use(request, response, next);

    expect(request.requestId).toMatch(UUID_PATTERN);
  });

  it('answers with the same id it put on the request -- the two halves are what make a trace joinable', () => {
    const { request, response, next } = buildContext();

    new RequestIdMiddleware().use(request, response, next);

    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, request.requestId);
  });

  it('rejects a header that would split the response, and does not echo it back', () => {
    const { request, response, next } = buildContext('injected\r\nSet-Cookie: session=stolen');

    new RequestIdMiddleware().use(request, response, next);

    expect(request.requestId).toMatch(UUID_PATTERN);
    expect(response.setHeader).not.toHaveBeenCalledWith(REQUEST_ID_HEADER, expect.stringContaining('Set-Cookie'));
  });

  it('passes the request on, since an id is a diagnostic aid and never a reason to refuse one', () => {
    const { request, response, next } = buildContext('two words');

    new RequestIdMiddleware().use(request, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });
});
