import {
  createNestablePublicClientApplication,
  InteractionRequiredAuthError,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import { AUTHORITY } from '@/constants/authentication.constants';
import { TokenAcquisitionFailedError } from '@/domain/errors/auth.errors';

/**
 * Builds a nestable MSAL client, or reuses the one already built.
 *
 * Initialising MSAL twice in one document produces two token caches that do not
 * see each other, which shows up as a user being prompted again moments after
 * signing in. The instance is therefore memoised per client id.
 */
const instances = new Map<string, Promise<IPublicClientApplication>>();

/**
 * Acquires a Graph token through Nested App Authentication.
 *
 * NAA is the modern path: the Office host brokers the token, so the user is
 * already signed in as far as MSAL is concerned and the silent call almost
 * always succeeds. The popup exists for the first run and for the cases the
 * broker cannot settle by itself -- consent that has never been granted, or a
 * conditional-access policy that wants a second factor.
 *
 * Only `InteractionRequiredAuthError` is treated as popup-worthy. Anything else
 * is a refusal rather than a prompt, and raising a window over it would ask the
 * user to fix something they cannot.
 *
 * Note what is *not* used here: `acquireTokenRedirect`, `handleRedirectPromise`,
 * `logout*` and `setActiveAccount` all throw or silently do nothing under NAA,
 * because there is no redirect for a nested app to come back from.
 *
 * @param clientId The Entra application to sign in to.
 * @param scopes The Graph permissions to request.
 * @returns A Graph access token.
 * @throws {TokenAcquisitionFailedError} When neither the silent call nor the popup succeeds.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in}
 * @see {@link https://www.npmjs.com/package/@azure/msal-browser}
 *
 * @example
 * ```ts
 * const accessToken = await acquireTokenViaNaa(clientId, GRAPH_SCOPES);
 * ```
 */
export async function acquireTokenViaNaa(clientId: string, scopes: readonly string[]): Promise<string> {
  const request = { scopes: [...scopes] };

  let client: IPublicClientApplication;

  try {
    let pending = instances.get(clientId);

    if (pending === undefined) {
      pending = createNestablePublicClientApplication({
        auth: { clientId, authority: AUTHORITY },
        cache: { cacheLocation: 'localStorage' },
      });
      instances.set(clientId, pending);
    }

    client = await pending;
  } catch (cause) {
    // A client that cannot be built is not worth caching: the next attempt
    // should try again rather than await the same rejected promise for ever.
    instances.delete(clientId);

    throw new TokenAcquisitionFailedError('naa-init', toError(cause));
  }

  try {
    const silent = await client.acquireTokenSilent(request);

    return silent.accessToken;
  } catch (cause) {
    if (!(cause instanceof InteractionRequiredAuthError)) {
      throw new TokenAcquisitionFailedError('naa-silent', toError(cause));
    }

    try {
      const interactive = await client.acquireTokenPopup(request);

      return interactive.accessToken;
    } catch (popupCause) {
      throw new TokenAcquisitionFailedError('naa-popup', toError(popupCause));
    }
  }
}

/** Narrows an unknown rejection to something a `cause` can carry. */
function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Forgets every memoised MSAL client.
 *
 * Only for tests -- the cache is deliberately process-wide, and a test that
 * built a client with a stubbed factory must not leak it into the next one.
 *
 * @example
 * ```ts
 * afterEach(() => resetNaaClients());
 * ```
 */
export function resetNaaClients(): void {
  instances.clear();
}
