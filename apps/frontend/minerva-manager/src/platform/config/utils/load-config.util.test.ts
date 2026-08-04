import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigInvalidError, ConfigParseError, ConfigRequestFailedError } from '@/domain/errors/config.errors';
import { configFixture } from '@/fixtures/config.fixture';
import { CONFIG_PATH } from '@/platform/config/config.types';
import { loadConfig } from './load-config.util';

/**
 * There is no msw in this repo, so `fetch` is stubbed directly. Each helper
 * builds the smallest response shape `loadConfig` touches.
 */
function stubFetch(response: Partial<Response>): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(response as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function okWith(json: () => Promise<unknown>): Partial<Response> {
  return { ok: true, status: 200, statusText: 'OK', json };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadConfig', () => {
  it('returns the validated document', async () => {
    stubFetch(okWith(() => Promise.resolve(configFixture)));

    await expect(loadConfig()).resolves.toEqual(configFixture);
  });

  it('reads the published path, bypassing the HTTP cache', async () => {
    const fetchMock = stubFetch(okWith(() => Promise.resolve(configFixture)));

    await loadConfig();

    expect(fetchMock).toHaveBeenCalledWith(CONFIG_PATH, { cache: 'no-store' });
  });

  it('reads an overridden path', async () => {
    const fetchMock = stubFetch(okWith(() => Promise.resolve(configFixture)));

    await loadConfig('/other/config.json');

    expect(fetchMock).toHaveBeenCalledWith('/other/config.json', { cache: 'no-store' });
  });

  it('rejects when the document is missing', async () => {
    stubFetch({ ok: false, status: 404, statusText: 'Not Found' });

    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigRequestFailedError);
  });

  it('reports the response it got, for whoever reads the log', async () => {
    stubFetch({ ok: false, status: 500, statusText: 'Internal Server Error' });

    await expect(loadConfig()).rejects.toMatchObject({
      code: 'ERR_001',
      payload: { path: CONFIG_PATH, status: 500, statusText: 'Internal Server Error' },
    });
  });

  it('rejects when the body is not JSON', async () => {
    const cause = new SyntaxError('Unexpected token <');
    stubFetch(okWith(() => Promise.reject(cause)));

    await expect(loadConfig()).rejects.toMatchObject({ code: 'ERR_002', cause });
    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigParseError);
  });

  it('rejects a document missing a key', async () => {
    const { sentryDsn: _omitted, ...incomplete } = configFixture;
    stubFetch(okWith(() => Promise.resolve(incomplete)));

    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigInvalidError);
  });

  it('rejects a document with a mistyped key', async () => {
    stubFetch(okWith(() => Promise.resolve({ ...configFixture, sentryTracesSampleRate: '0.2' })));

    await expect(loadConfig()).rejects.toMatchObject({ code: 'ERR_003' });
  });

  it('rejects a document that is not an object', async () => {
    stubFetch(okWith(() => Promise.resolve('<!doctype html>')));

    await expect(loadConfig()).rejects.toBeInstanceOf(ConfigInvalidError);
  });
});
