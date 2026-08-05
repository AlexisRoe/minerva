import type { Adapters } from '@/adapters/create-adapters.util';
import { ButtonDisabledError, SessionNotAuthorizedError } from '@/domain/errors/session.errors';
import { useSessionStore } from '@/stores/session/session.store';

/**
 * Runs the pane's start-up sequence, in order, before the report page renders.
 *
 * Handed to the `AsyncLoading` that wraps the report screen, and that placement
 * is the substance of this step rather than a detail. Every stage is a
 * precondition for the next -- there is no settings call without a session, no
 * session without a token, no token without a host -- so the sequence has to
 * complete before anything renders, or the user watches a page assemble itself
 * in stages and reflow under them.
 *
 * The order is: read the host, sign in, trade the token for a session, fetch the
 * tenant's settings. Nothing reaches {@link useSessionStore} until all of it has
 * landed *and* been checked, in a single write at the end. That is the point of
 * this file: the report page can be rendered on the strength of the store being
 * filled, without asking which half of it arrived. A failure half way therefore
 * leaves the store empty rather than partly filled, which is the honest
 * description of a pane that never started.
 *
 * Two of the checks are of answers rather than of failures. The backend can
 * validate a token and still decline the user, and a tenant can have the button
 * switched off; both are successful calls whose content means the pane must
 * stop, so each gets its own error rather than a page whose every action fails
 * one at a time. `enabled: false` is not a fault, and lands on the no-content
 * screen accordingly.
 *
 * Nothing is caught here. A failure propagates out of the promise, `AsyncLoading`
 * rethrows it during render, and `MinervaErrorBoundary` turns it into
 * `ErrorScreen` -- which reads the error registry and shows the "cannot run
 * here" wording, with no retry, for the environment failures and for a tenant
 * that has switched the button off. One path, whatever broke.
 *
 * Demo mode does not appear in this file at all: the adapters were chosen once
 * in `main.tsx`, so a demo run walks exactly these steps against fixtures.
 *
 * @param adapters The adapter set for this run of the pane.
 * @returns A loader for {@link AsyncLoading}.
 *
 * @example
 * ```tsx
 * const loader = useMemo(() => createBootstrapLoader(adapters), [adapters]);
 *
 * <AsyncLoading loader={loader}><ReportView /></AsyncLoading>
 * ```
 */
export function createBootstrapLoader({ office, minerva }: Adapters): () => Promise<void> {
  return async function bootstrapLoader(): Promise<void> {
    const { environment, message, user } = await office.readHost();

    const authToken = await office.acquireToken();
    const authorization = await minerva.authorize({ authToken });

    if (!authorization.isAuthorized) {
      throw new SessionNotAuthorizedError(authorization.sessionId);
    }

    const settings = await minerva.getSettings({ userLanguage: user.language });

    if (!settings.enabled) {
      throw new ButtonDisabledError();
    }

    // The one write, and the last thing the sequence does: everything above has
    // to have succeeded for the pane to hold any of it.
    useSessionStore.getState().setSession({
      office: { environment, message, user },
      auth: { authorization, flow: environment.naaSupported ? 'naa' : 'dialog' },
      settings,
    });
  };
}
