import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '../../config/config.fixture';
import { demoEnvironment } from '../../demo';
import { createPaneAdapters } from './report.loader';

// The parameters are declared even though the body ignores them: without them
// `mock.calls` is typed as an empty tuple and the provider cannot be read back.
const { acquireToken, createAdapters } = vi.hoisted(() => ({
  acquireToken: vi.fn((_clientId: string | null, _environment: unknown) =>
    Promise.resolve({ accessToken: 'graph-token', flow: 'naa' }),
  ),
  createAdapters: vi.fn((_config: unknown, _getAccessToken: () => Promise<string>) => ({
    minerva: {},
    graph: {},
  })),
}));

vi.mock('../../auth', () => ({ acquireToken }));
vi.mock('../../adapters', () => ({ createAdapters }));

/** Runs the token provider `createPaneAdapters` handed to the Graph adapter. */
async function resolveToken(config = configFixture): Promise<string> {
  createPaneAdapters(config, demoEnvironment);

  const provider = createAdapters.mock.calls[0]?.[1];

  return provider === undefined ? Promise.reject(new Error('no provider built')) : provider();
}

describe('createPaneAdapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the configuration straight through', () => {
    createPaneAdapters(configFixture, demoEnvironment);

    expect(createAdapters).toHaveBeenCalledWith(configFixture, expect.any(Function));
  });

  it('builds a token provider that signs in for this environment', async () => {
    const config = { ...configFixture, entraClientId: 'client-1' };

    await expect(resolveToken(config)).resolves.toBe('graph-token');

    // Which flow the environment supports is decided once at start-up; the Graph
    // adapter must not have to know or ask.
    expect(acquireToken).toHaveBeenCalledWith('client-1', demoEnvironment);
  });

  it('does not sign in until the provider is actually called', () => {
    createPaneAdapters({ ...configFixture, entraClientId: 'client-1' }, demoEnvironment);

    // Demo mode never calls it, and a pane that acquired a token eagerly would
    // prompt a user who was only being shown a walkthrough.
    expect(acquireToken).not.toHaveBeenCalled();
  });

  it('lets a sign-in failure reach the caller rather than swallowing it', async () => {
    acquireToken.mockRejectedValueOnce(new Error('consent required'));

    await expect(resolveToken()).rejects.toThrow('consent required');
  });
});
