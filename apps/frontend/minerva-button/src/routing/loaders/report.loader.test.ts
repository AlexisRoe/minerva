import { Languages } from '@minerva/typescript-lib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '../../config/config.fixture';
import { demoAuthorization, demoEnvironment, demoMessage, demoSettings, demoUser } from '../../demo';
import { OfficeHostUnsupportedError, OfficeLoadTimeoutError, OfficeRequirementSetError } from '../../errors';
import { useOfficeStore, useSessionStore, useSettingsStore } from '../../store';
import { createReportLoader } from './report.loader';

const { waitForOffice, readEnvironment, readCurrentMessage, readCurrentUser, acquireToken } = vi.hoisted(() => ({
  waitForOffice: vi.fn(() => Promise.resolve({ host: 'Outlook', platform: 'OfficeOnline' })),
  readEnvironment: vi.fn(() => demoEnvironment),
  readCurrentMessage: vi.fn(() => demoMessage),
  readCurrentUser: vi.fn(() => demoUser),
  acquireToken: vi.fn(() => Promise.resolve({ accessToken: 'graph-token', flow: 'naa' })),
}));

vi.mock('../../adapters/office', () => ({
  waitForOffice,
  readEnvironment,
  readCurrentMessage,
  readCurrentUser,
}));

vi.mock('../../auth', () => ({ acquireToken }));

const { authorize, getSettings } = vi.hoisted(() => ({
  authorize: vi.fn(() => Promise.resolve(demoAuthorization)),
  getSettings: vi.fn(() => Promise.resolve(demoSettings)),
}));

vi.mock('../../adapters', () => ({
  createAdapters: () => ({ minerva: { authorize, getSettings }, graph: {} }),
}));

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn((_error: unknown) => 'event-1') }));

vi.mock('../../sentry', () => ({ captureError }));

/** The live (non-demo) configuration these cases boot with. */
const config = { ...configFixture, entraClientId: 'client-1' };

describe('createReportLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    useOfficeStore.getState().reset();
    useSessionStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('fills all three stores on the happy path', async () => {
    await expect(createReportLoader(config)()).resolves.toBeNull();

    expect(useOfficeStore.getState()).toMatchObject({
      environment: demoEnvironment,
      message: demoMessage,
      user: demoUser,
    });
    expect(useSessionStore.getState()).toMatchObject({
      authorization: demoAuthorization,
      flow: 'naa',
    });
    expect(useSettingsStore.getState().settings).toEqual(demoSettings);
  });

  it('runs the sequence in order, because each stage needs the last', async () => {
    const order: string[] = [];

    waitForOffice.mockImplementationOnce(() => {
      order.push('office');

      return Promise.resolve({ host: 'Outlook', platform: 'OfficeOnline' });
    });
    acquireToken.mockImplementationOnce(() => {
      order.push('token');

      return Promise.resolve({ accessToken: 'graph-token', flow: 'naa' });
    });
    authorize.mockImplementationOnce(() => {
      order.push('authorize');

      return Promise.resolve(demoAuthorization);
    });
    getSettings.mockImplementationOnce(() => {
      order.push('settings');

      return Promise.resolve(demoSettings);
    });

    await createReportLoader(config)();

    expect(order).toEqual(['office', 'token', 'authorize', 'settings']);
  });

  it('fetches the settings in the language the host reports', async () => {
    readCurrentUser.mockReturnValueOnce({ ...demoUser, language: Languages.German });

    await createReportLoader(config)();

    expect(getSettings).toHaveBeenCalledWith({ userLanguage: Languages.German });
  });

  it('trades the acquired token for a session', async () => {
    await createReportLoader(config)();

    expect(acquireToken).toHaveBeenCalledWith('client-1', demoEnvironment);
    expect(authorize).toHaveBeenCalledWith({ authToken: 'graph-token' });
  });

  describe('when the pane cannot run here', () => {
    it.each([
      ['ERR_007', () => new OfficeLoadTimeoutError(5000)],
      ['ERR_008', () => new OfficeHostUnsupportedError('Word', 'PC')],
      ['ERR_009', () => new OfficeRequirementSetError('Mailbox', '1.13', 'Outlook', 'PC')],
    ])('redirects to /unsupported with %s rather than throwing', async (code, build) => {
      waitForOffice.mockRejectedValueOnce(build());

      const result = (await createReportLoader(config)()) as Response;

      // Not faults: the user is outside Outlook, or on a client too old. A stack
      // trace would be the wrong response, and there is nothing to retry.
      expect(result.status).toBe(302);
      expect(result.headers.get('Location')).toBe(`/unsupported?reason=${code}`);
    });

    it('carries the reason so the screen can be specific', async () => {
      readEnvironment.mockImplementationOnce(() => {
        throw new OfficeHostUnsupportedError('Excel', 'Mac');
      });

      const result = (await createReportLoader(config)()) as Response;

      expect(result.headers.get('Location')).toContain('reason=ERR_008');
    });

    it('still reports it, so the redirect leaves a trace', async () => {
      const failure = new OfficeLoadTimeoutError(5000);
      waitForOffice.mockRejectedValueOnce(failure);

      await createReportLoader(config)();

      expect(captureError).toHaveBeenCalledWith(failure);
    });

    it('reports it as the warning it declares itself to be', async () => {
      // The volume is the error's own business: `captureError` reads `logLevel`,
      // so the loader does not get to decide how loud an environment failure is.
      waitForOffice.mockRejectedValueOnce(new OfficeHostUnsupportedError('Word', 'PC'));

      await createReportLoader(config)();

      expect(vi.mocked(captureError).mock.calls[0]?.[0]).toHaveProperty('logLevel', 'warn');
    });
  });

  it('rethrows anything else for the router errorElement', async () => {
    const failure = new Error('settings endpoint exploded');
    getSettings.mockRejectedValueOnce(failure);

    await expect(createReportLoader(config)()).rejects.toBe(failure);
  });

  it('keeps what did succeed readable when a later stage fails', async () => {
    getSettings.mockRejectedValueOnce(new Error('nope'));

    await expect(createReportLoader(config)()).rejects.toThrow();

    // The error screen can then say who the user was, rather than showing a pane
    // that knows nothing about itself.
    expect(useOfficeStore.getState().user).toEqual(demoUser);
    expect(useSessionStore.getState().authorization).toEqual(demoAuthorization);
  });

  describe('in demo mode', () => {
    const demoConfig = { ...config, demo: true };

    it('never touches the host or asks for a token', async () => {
      await expect(createReportLoader(demoConfig)()).resolves.toBeNull();

      // Demo mode has to run in a plain browser, where Office.js is never
      // installed and there is nothing to acquire a token from.
      expect(waitForOffice).not.toHaveBeenCalled();
      expect(acquireToken).not.toHaveBeenCalled();
    });

    it('still fills the stores, so every screen has something to render', async () => {
      await createReportLoader(demoConfig)();

      expect(useOfficeStore.getState().message).toEqual(demoMessage);
      expect(useSettingsStore.getState().settings).toEqual(demoSettings);
    });
  });
});
