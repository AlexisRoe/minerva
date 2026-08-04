import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OfficeEnvironment } from '../../adapters/office';
import { demoEnvironment } from '../../demo';
import { GRAPH_SCOPES, SHARED_GRAPH_SCOPES } from '../types/auth.types';
import { acquireToken } from './acquire-token.util';

const { acquireTokenViaNaa, acquireTokenViaDialog } = vi.hoisted(() => ({
  acquireTokenViaNaa: vi.fn(() => Promise.resolve('naa-token')),
  acquireTokenViaDialog: vi.fn(() => Promise.resolve('dialog-token')),
}));

vi.mock('./naa.util', () => ({ acquireTokenViaNaa }));
vi.mock('./dialog.util', () => ({ acquireTokenViaDialog }));

const withoutNaa: OfficeEnvironment = { ...demoEnvironment, naaSupported: false };

describe('acquireToken', () => {
  beforeEach(() => {
    // Several cases here assert that a flow was *not* taken, which only means
    // anything if the previous case's calls have been forgotten.
    vi.clearAllMocks();
  });

  it('uses NAA where the host can broker the token', async () => {
    await expect(acquireToken('client-1', demoEnvironment)).resolves.toEqual({
      accessToken: 'naa-token',
      flow: 'naa',
    });
    expect(acquireTokenViaDialog).not.toHaveBeenCalled();
  });

  it('falls back to the dialog on a client without NAA', async () => {
    await expect(acquireToken('client-1', withoutNaa)).resolves.toEqual({
      accessToken: 'dialog-token',
      flow: 'dialog',
    });
    expect(acquireTokenViaNaa).not.toHaveBeenCalled();
  });

  it('asks for the mailbox scopes the open item actually needs', async () => {
    await acquireToken('client-1', demoEnvironment, false);
    expect(acquireTokenViaNaa).toHaveBeenLastCalledWith('client-1', GRAPH_SCOPES);

    await acquireToken('client-1', demoEnvironment, true);
    // The plain scopes only ever reach the signed-in user's own mail, so a
    // delegate mailbox would be refused rather than silently returning nothing.
    expect(acquireTokenViaNaa).toHaveBeenLastCalledWith('client-1', SHARED_GRAPH_SCOPES);
  });

  it('fails with ERR_013 before trying anything when unconfigured', async () => {
    await expect(acquireToken(null, demoEnvironment)).rejects.toMatchObject({ code: 'ERR_013' });

    // An incomplete deployment must not surface as a sign-in failure the tenant
    // would go looking for in Entra.
    expect(acquireTokenViaNaa).not.toHaveBeenCalled();
    expect(acquireTokenViaDialog).not.toHaveBeenCalled();
  });
});
