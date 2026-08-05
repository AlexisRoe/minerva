import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS, NO_RESPONSE_STATUS } from '@/constants/request.constants';
import { MinervaRequestFailedError, RequestTimedOutError } from '@/domain/errors/request.errors';
import { request } from './request.util';

const failure = (path: string, status: number, cause?: Error): MinervaRequestFailedError =>
  new MinervaRequestFailedError(path, status, cause);

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the response undecoded, so each caller picks its own body', async () => {
    const response = new Response('{"ok":true}', { status: 200 });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response)),
    );

    await expect(request('/api/button/settings', { method: 'GET' }, failure)).resolves.toBe(response);
  });

  it('always sends the session cookie', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(new Response('', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await request('/api/button/settings', { method: 'GET' }, failure);

    // The cookie is httpOnly, so this is the only thing that makes it travel;
    // a caller cannot compensate for its absence.
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/button/settings',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('does not let a caller opt out of the credentials mode', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(new Response('', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await request('/api/button/settings', { credentials: 'omit' }, failure);

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
  });

  it('turns a non-2xx status into the error the caller supplied', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response('nope', { status: 503 }))),
    );

    await expect(request('/api/button/report', { method: 'POST' }, failure)).rejects.toMatchObject({
      code: 'ERR_011',
      payload: { path: '/api/button/report', status: 503 },
    });
  });

  it('reports an unreachable host as a status of zero', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(cause)),
    );

    // fetch rejects rather than resolving here, so there is no status to record;
    // the call must still fail as a MinervaError rather than a bare TypeError.
    const error = await request('/api/button/authorize', {}, failure).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(MinervaRequestFailedError);
    expect(error).toMatchObject({
      payload: { path: '/api/button/authorize', status: NO_RESPONSE_STATUS },
    });
    expect(error.cause).toBe(cause);
  });

  it('aborts a call that outlives its timeout', async () => {
    vi.useFakeTimers();
    // A fetch that never settles unless the signal aborts it -- the hung call the
    // timeout exists for.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }),
      ),
    );

    const pending = request('/api/button/report', { method: 'POST' }, failure, 100).catch((thrown) => thrown);
    await vi.advanceTimersByTimeAsync(100);
    const error = await pending;

    expect(error).toBeInstanceOf(RequestTimedOutError);
    expect(error).toMatchObject({
      code: 'ERR_020',
      payload: { path: '/api/button/report', timeoutInMilliseconds: 100 },
    });

    vi.useRealTimers();
  });

  it('falls back to the default timeout when none is given', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }),
      ),
    );

    const pending = request('/api/button/settings', { method: 'GET' }, failure).catch((thrown) => thrown);
    await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS);

    await expect(pending).resolves.toMatchObject({
      payload: { timeoutInMilliseconds: DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS },
    });

    vi.useRealTimers();
  });

  it('does not raise a timeout for a call that answered before it', async () => {
    vi.useFakeTimers();
    const response = new Response('', { status: 200 });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response)),
    );

    await expect(request('/api/button/settings', { method: 'GET' }, failure, 100)).resolves.toBe(response);

    // The timer is cleared on the way out, so nothing aborts afterwards.
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });

  it('wraps a non-Error rejection rather than passing it through as a cause', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject('offline')),
    );

    const error = await request('/api/button/authorize', {}, failure).catch((thrown) => thrown);

    expect(error.cause).toBeInstanceOf(Error);
    expect((error.cause as Error).message).toBe('offline');
  });
});
