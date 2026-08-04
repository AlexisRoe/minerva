import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Adapters } from '@/adapters/create-adapters.util';
import { OfficeHostUnsupportedError } from '@/domain/errors/office.errors';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { demoAuthorization, demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { useOfficeStore } from '@/stores/office/office.store';
import { useSessionStore } from '@/stores/session/session.store';
import { useSettingsStore } from '@/stores/settings/settings.store';
import { createBootstrapLoader } from './bootstrap.loader';

/** The four calls the sequence makes, spied so their order can be asserted. */
function spies(order: string[] = []) {
  return {
    order,
    readHost: vi.fn(() => {
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
    useOfficeStore.getState().reset();
    useSessionStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('fills all three stores on the happy path', async () => {
    await createBootstrapLoader(withSpies(spies()))();

    expect(useOfficeStore.getState()).toMatchObject({
      environment: demoEnvironment,
      message: demoMessage,
      user: demoUser,
    });
    expect(useSessionStore.getState()).toMatchObject({ authorization: demoAuthorization, flow: 'naa' });
    expect(useSettingsStore.getState().settings).toEqual(demoSettings);
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

    expect(useSessionStore.getState().flow).toBe('dialog');
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

  it('keeps what did succeed when a later stage fails', async () => {
    const spied = spies();
    spied.getSettings.mockRejectedValueOnce(new Error('backend down'));

    await expect(createBootstrapLoader(withSpies(spied))()).rejects.toThrow('backend down');

    // Written as they land rather than rolled back, so the error screen can still
    // say who the user was.
    expect(useOfficeStore.getState().user).toEqual(demoUser);
    expect(useSessionStore.getState().authorization).toEqual(demoAuthorization);
    expect(useSettingsStore.getState().settings).toBeNull();
  });
});
