import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Adapters } from '@/adapters/create-adapters.util';
import type { OfficeHost } from '@/adapters/office/office.types';
import { OfficeHostUnsupportedError } from '@/domain/errors/office.errors';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { demoAuthorization, demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import { createBootstrapLoader } from './bootstrap.loader';

/** The four calls the sequence makes, spied so their order can be asserted. */
function spies(order: string[] = []) {
  return {
    order,
    readHost: vi.fn((): Promise<OfficeHost> => {
      order.push('host');

      return Promise.resolve({ environment: demoEnvironment, message: demoMessage, user: demoUser });
    }),
    acquireToken: vi.fn(() => {
      order.push('token');

      return Promise.resolve('graph-token');
    }),
    authorize: vi.fn(() => {
      order.push('authorize');

      return Promise.resolve(demoAuthorization);
    }),
    getSettings: vi.fn(() => {
      order.push('settings');

      return Promise.resolve(demoSettings);
    }),
  };
}

/** An adapter set whose Office and Minerva calls are the given spies. */
function withSpies(spied: ReturnType<typeof spies>): Adapters {
  const base = adaptersFixture();

  return {
    ...base,
    office: { ...base.office, readHost: spied.readHost, acquireToken: spied.acquireToken },
    minerva: { ...base.minerva, authorize: spied.authorize, getSettings: spied.getSettings },
  };
}

describe('createBootstrapLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('fills the whole session on the happy path', async () => {
    await createBootstrapLoader(withSpies(spies()))();

    expect(useSessionStore.getState()).toMatchObject({
      office: { environment: demoEnvironment, message: demoMessage, user: demoUser },
      auth: { authorization: demoAuthorization, flow: 'naa' },
      settings: demoSettings,
    });
  });

  it('runs the sequence in order, because each stage needs the last', async () => {
    const order: string[] = [];

    await createBootstrapLoader(withSpies(spies(order)))();

    // There is no settings call without a session, no session without a token,
    // and no token without a host.
    expect(order).toEqual(['host', 'token', 'authorize', 'settings']);
  });

  it('signs in with the token the host brokered', async () => {
    const spied = spies();

    await createBootstrapLoader(withSpies(spied))();

    expect(spied.authorize).toHaveBeenCalledWith({ authToken: 'graph-token' });
  });

  it('fetches the settings for the language the user reads Outlook in', async () => {
    const spied = spies();

    await createBootstrapLoader(withSpies(spied))();

    expect(spied.getSettings).toHaveBeenCalledWith({ userLanguage: demoUser.language });
  });

  it('records the dialog flow on a client without NAA', async () => {
    const spied = spies();
    spied.readHost.mockResolvedValueOnce({
      environment: { ...demoEnvironment, naaSupported: false },
      message: demoMessage,
      user: demoUser,
    });

    await createBootstrapLoader(withSpies(spied))();

    expect(useSessionStore.getState().auth?.flow).toBe('dialog');
  });

  it('starts a pane opened on no message, which is not a failure', async () => {
    const spied = spies();
    spied.readHost.mockResolvedValueOnce({ environment: demoEnvironment, message: null, user: demoUser });

    await createBootstrapLoader(withSpies(spied))();

    // The report page says "no message open" for itself; there is nothing here
    // to stop for.
    expect(useSessionStore.getState().office).toMatchObject({ message: null, user: demoUser });
  });

  it('throws rather than redirecting when the pane cannot run here', async () => {
    const spied = spies();
    spied.readHost.mockRejectedValueOnce(new OfficeHostUnsupportedError('Word', 'PC'));

    // The error screen reads the registry and says "cannot run here" without a
    // retry; there is no second screen and no redirect to disagree with it.
    await expect(createBootstrapLoader(withSpies(spied))()).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_008' }),
    );
    expect(spied.acquireToken).not.toHaveBeenCalled();
  });

  it('stops on a user the backend declined, before fetching any settings', async () => {
    const spied = spies();
    spied.authorize.mockResolvedValueOnce({ ...demoAuthorization, isAuthorized: false });

    await expect(createBootstrapLoader(withSpies(spied))()).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_018' }),
    );

    // Every later call would be refused one at a time; the pane says so once.
    expect(spied.getSettings).not.toHaveBeenCalled();
  });

  it('stops where the tenant has switched the button off', async () => {
    const spied = spies();
    spied.getSettings.mockResolvedValueOnce({ ...demoSettings, enabled: false });

    // A successful call whose content means the pane must not run: the registry
    // sends it to the no-content screen rather than the error one.
    await expect(createBootstrapLoader(withSpies(spied))()).rejects.toThrow(
      expect.objectContaining({ code: 'ERR_017' }),
    );
    expect(useSessionStore.getState().settings).toBeNull();
  });

  it('writes nothing at all when a later stage fails', async () => {
    const spied = spies();
    spied.getSettings.mockRejectedValueOnce(new Error('backend down'));

    await expect(createBootstrapLoader(withSpies(spied))()).rejects.toThrow('backend down');

    // The single write is the last thing the sequence does, so a pane that never
    // finished starting holds nothing -- rather than a half-session the report
    // page would have to defend itself against.
    expect(useSessionStore.getState()).toMatchObject({ office: null, auth: null, settings: null });
  });

  it('writes once, so nothing can render against a partial session', async () => {
    const seen: unknown[] = [];
    const unsubscribe = useSessionStore.subscribe((state) => seen.push(state.office));

    await createBootstrapLoader(withSpies(spies()))();
    unsubscribe();

    expect(seen).toHaveLength(1);
  });
});
