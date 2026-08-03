import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ConfigDomainMismatchError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigRequestFailedError,
} from '../../errors';
import { configFixture } from '../config.fixture';
import { CONFIG_PATH, MAX_RETRY } from '../config.types';
import { loadConfig } from './load-config.util';

/**
 * There is no msw in this repo, so `fetch` is stubbed directly. Each helper
 * builds the smallest response shape `loadConfig` touches.
 */
function stubFetch(response: Partial<Response>) {
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

/**
 * The second half of the same call: the URL the pane was opened with. The
 * document is always served with `appDomain` set here, so each case is about
 * the host or the query string and nothing else.
 */
describe('loadConfig, against the current URL', () => {
  const domain = 'button.minerva.example';
  const href = `https://${domain}/`;

  function stubDocument(appDomain: string | null = domain, allowDemo = true) {
    stubFetch(okWith(() => Promise.resolve({ ...configFixture, appDomain, allowDemo })));
  }

  it('accepts the configured host', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, href)).resolves.toMatchObject({ host: domain, retry: 0, demo: false });
  });

  it.each([
    ['a scheme', `https://${domain}`],
    ['a trailing slash', `https://${domain}/`],
    ['a port', `${domain}:443`],
    ['upper case', domain.toUpperCase()],
  ])('accepts the host when the domain is configured with %s', async (_label, appDomain) => {
    stubDocument(appDomain);

    await expect(loadConfig(CONFIG_PATH, href)).resolves.toMatchObject({ host: domain });
  });

  it('rejects any other host', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, 'https://evil.example/')).rejects.toBeInstanceOf(ConfigDomainMismatchError);
  });

  it('reports both hosts, so the log line says what was expected', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, 'https://evil.example/')).rejects.toMatchObject({
      code: 'ERR_006',
      payload: { expected: domain, actual: 'evil.example' },
    });
  });

  it.each([null, ''])('accepts any host when the domain is not pinned (%s)', async (appDomain) => {
    stubDocument(appDomain);

    await expect(loadConfig(CONFIG_PATH, 'http://localhost:4101/')).resolves.toMatchObject({ host: 'localhost' });
  });

  it('reads a retry of 1', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?retry=1`)).resolves.toMatchObject({ retry: 1 });
  });

  it.each(['2', '99', '1.9'])('never reports a retry above the cap (?retry=%s)', async (raw) => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?retry=${raw}`)).resolves.toMatchObject({ retry: MAX_RETRY });
  });

  it.each(['abc', '-1', '', 'NaN'])('falls back to 0 for an unusable retry (?retry=%s)', async (raw) => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?retry=${raw}`)).resolves.toMatchObject({ retry: 0 });
  });

  it('reads demo mode from ?demo=true where the deployment allows it', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?demo=true`)).resolves.toMatchObject({ demo: true });
  });

  it('ignores ?demo=true where the deployment does not allow it', async () => {
    stubDocument(domain, false);

    await expect(loadConfig(CONFIG_PATH, `${href}?demo=true`)).resolves.toMatchObject({ demo: false });
  });

  it('does not turn demo mode on by allowing it alone', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, href)).resolves.toMatchObject({ demo: false });
  });

  it('rejects a document without the demo switch', async () => {
    const { allowDemo: _omitted, ...incomplete } = configFixture;
    stubFetch(okWith(() => Promise.resolve(incomplete)));

    await expect(loadConfig(CONFIG_PATH, href)).rejects.toBeInstanceOf(ConfigInvalidError);
  });

  it.each(['false', '1', 'TRUE', 'yes', ''])('treats any other demo value as off (?demo=%s)', async (raw) => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?demo=${raw}`)).resolves.toMatchObject({ demo: false });
  });

  it('reads both parameters together', async () => {
    stubDocument();

    await expect(loadConfig(CONFIG_PATH, `${href}?retry=1&demo=true`)).resolves.toMatchObject({
      host: domain,
      retry: 1,
      demo: true,
    });
  });
});
