import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTHORITY, acquireTokenViaNaa, resetNaaClients } from './naa.util';

const { createNestablePublicClientApplication } = vi.hoisted(() => ({
  createNestablePublicClientApplication: vi.fn(),
}));

vi.mock('@azure/msal-browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@azure/msal-browser')>()),
  createNestablePublicClientApplication,
}));

/** A client whose two acquisition calls can be programmed per test. */
function stubClient(options: {
  silent?: () => Promise<{ accessToken: string }>;
  popup?: () => Promise<{ accessToken: string }>;
}) {
  const acquireTokenSilent = vi.fn(options.silent ?? (() => Promise.resolve({ accessToken: 'silent-token' })));
  const acquireTokenPopup = vi.fn(options.popup ?? (() => Promise.resolve({ accessToken: 'popup-token' })));

  createNestablePublicClientApplication.mockResolvedValue({
    acquireTokenSilent,
    acquireTokenPopup,
  });

  return { acquireTokenSilent, acquireTokenPopup };
}

describe('acquireTokenViaNaa', () => {
  beforeEach(() => {
    resetNaaClients();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the silently acquired token without prompting', async () => {
    const { acquireTokenPopup } = stubClient({});

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).resolves.toBe('silent-token');

    // The host has already brokered the sign-in; raising a window here would ask
    // the user to redo something that has happened.
    expect(acquireTokenPopup).not.toHaveBeenCalled();
  });

  it('signs in against the common authority, not a fixed tenant', async () => {
    stubClient({});

    await acquireTokenViaNaa('client-1', ['Mail.Read']);

    expect(createNestablePublicClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { clientId: 'client-1', authority: AUTHORITY } }),
    );
  });

  it('falls back to the popup when interaction is required', async () => {
    const { acquireTokenPopup } = stubClient({
      silent: () => Promise.reject(new InteractionRequiredAuthError('consent_required', 'Consent is required.')),
    });

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).resolves.toBe('popup-token');
    expect(acquireTokenPopup).toHaveBeenCalledWith({ scopes: ['Mail.Read'] });
  });

  it('does not prompt for a failure a prompt cannot fix', async () => {
    const { acquireTokenPopup } = stubClient({
      silent: () => Promise.reject(new Error('network down')),
    });

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).rejects.toMatchObject({
      code: 'ERR_014',
      payload: { flow: 'naa-silent' },
    });
    expect(acquireTokenPopup).not.toHaveBeenCalled();
  });

  it('reports a dismissed prompt as ERR_014 from the popup', async () => {
    stubClient({
      silent: () => Promise.reject(new InteractionRequiredAuthError('consent_required', 'Consent is required.')),
      popup: () => Promise.reject(new Error('user cancelled')),
    });

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).rejects.toMatchObject({
      code: 'ERR_014',
      payload: { flow: 'naa-popup' },
    });
  });

  it('reports a client that cannot be built as ERR_014', async () => {
    createNestablePublicClientApplication.mockRejectedValue(new Error('not nestable'));

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).rejects.toMatchObject({
      code: 'ERR_014',
      payload: { flow: 'naa-init' },
    });
  });

  it('builds one client per id, so the token cache is not split', async () => {
    stubClient({});

    await acquireTokenViaNaa('client-1', ['Mail.Read']);
    await acquireTokenViaNaa('client-1', ['Mail.Read']);

    // Two instances mean two caches that cannot see each other, which shows up as
    // a user being prompted again moments after signing in.
    expect(createNestablePublicClientApplication).toHaveBeenCalledTimes(1);
  });

  it('retries construction after a failure rather than caching the rejection', async () => {
    createNestablePublicClientApplication.mockRejectedValueOnce(new Error('transient'));

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).rejects.toMatchObject({
      code: 'ERR_014',
    });

    stubClient({});

    await expect(acquireTokenViaNaa('client-1', ['Mail.Read'])).resolves.toBe('silent-token');
  });
});
