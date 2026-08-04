import type { OfficeEnvironment } from '../../adapters/office';
import { GRAPH_SCOPES, SHARED_GRAPH_SCOPES } from '../../constants/authentication.constants';
import { AuthClientIdMissingError } from '../../errors';
import type { AuthResult } from '../types/auth.types';
import { acquireTokenViaDialog } from './dialog.util';
import { acquireTokenViaNaa } from './naa.util';

/**
 * Signs the user in and hands back a Graph token.
 *
 * The one entry point above the two flows, and the only place that decides
 * between them. `naaSupported` comes from the start-up gate rather than being
 * probed here, so the decision is made once per pane on a fact that cannot
 * change while it is open.
 *
 * @param clientId The Entra application to sign in to, or `null` if unconfigured.
 * @param environment What the start-up gate learned about the host.
 * @param sharedMailbox Whether the open item is in a mailbox the user does not own.
 * @returns The access token, and which flow produced it.
 * @throws {AuthClientIdMissingError} When no Entra application is configured.
 * @throws {TokenAcquisitionFailedError} When NAA cannot produce a token.
 * @throws {AuthDialogFailedError} When the dialog fallback cannot produce one.
 *
 * @see {@link ./naa.util.ts} -- the primary flow
 * @see {@link ./dialog.util.ts} -- the fallback for clients without NAA
 *
 * @example
 * ```ts
 * const { accessToken } = await acquireToken(config.entraClientId, environment);
 * ```
 */
export async function acquireToken(
  clientId: string | null,
  environment: OfficeEnvironment,
  sharedMailbox = false,
): Promise<AuthResult> {
  if (clientId === null) {
    throw new AuthClientIdMissingError();
  }

  if (!environment.naaSupported) {
    const accessToken = await acquireTokenViaDialog(clientId);

    return { accessToken, flow: 'dialog' };
  }

  const scopes = sharedMailbox ? SHARED_GRAPH_SCOPES : GRAPH_SCOPES;
  const accessToken = await acquireTokenViaNaa(clientId, scopes);

  return { accessToken, flow: 'naa' };
}
