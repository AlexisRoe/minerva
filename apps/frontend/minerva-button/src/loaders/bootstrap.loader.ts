import type { Adapters } from '@/adapters/create-adapters.util';
import { useOfficeStore } from '@/stores/office/office.store';
import { useSessionStore } from '@/stores/session/session.store';
import { useSettingsStore } from '@/stores/settings/settings.store';

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
 * tenant's settings. Each result is written to its store as it lands, so a
 * failure half way leaves what did succeed readable rather than rolling back --
 * the error screen can then say who the user was.
 *
 * Nothing is caught here. A failure propagates out of the promise, `AsyncLoading`
 * rethrows it during render, and `MinervaErrorBoundary` turns it into
 * `ErrorScreen` -- which reads the error registry and shows the "cannot run
 * here" wording, with no retry, for the three environment failures. One path,
 * whatever broke.
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

    useOfficeStore.getState().setOffice({ environment, message, user });

    const authToken = await office.acquireToken();
    const authorization = await minerva.authorize({ authToken });

    useSessionStore.getState().setSession({ authorization, flow: environment.naaSupported ? 'naa' : 'dialog' });

    const settings = await minerva.getSettings({ userLanguage: user.language });

    useSettingsStore.getState().setSettings(settings);
  };
}
