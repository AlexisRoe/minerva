import { MinervaError } from '@minerva/typescript-lib';
import { redirect } from 'react-router';

import { type Adapters, createAdapters } from '../../adapters';
import {
  type OfficeEnvironment,
  readCurrentMessage,
  readCurrentUser,
  readEnvironment,
  waitForOffice,
} from '../../adapters/office';
import { acquireToken } from '../../auth';
import type { AppConfig } from '../../config';
import { REASON_PARAM, ROUTES } from '../../constants/routes.constants';
import { demoEnvironment, demoMessage, demoUser } from '../../demo';
import { ErrorScreenKind, lookupErrorPolicy } from '../../errors';
import { captureError } from '../../sentry';
import { useOfficeStore, useSessionStore, useSettingsStore } from '../../store';

/**
 * Whether a failure means "this pane cannot run here" rather than "something broke".
 *
 * Asked of the error registry rather than a list kept here, so the loader, the
 * unsupported screen and the error screen cannot disagree about which failures
 * are environmental. Adding an error answers this once, where the error is
 * declared.
 */
function isUnsupported(error: unknown): boolean {
  return MinervaError.is(error) && lookupErrorPolicy(error.code).screen === ErrorScreenKind.NoContent;
}

/**
 * Builds the adapter set for a signed-in pane.
 *
 * Exported because the reporting action needs the same set, and building it
 * twice is cheap -- MSAL memoises its client, and a token acquired once is
 * returned from cache thereafter.
 *
 * @param config The configuration the app booted with.
 * @param environment What the start-up gate learned about the host.
 * @returns The Minerva and Graph adapters, live or demo.
 *
 * @example
 * ```ts
 * const { graph } = createPaneAdapters(config, environment);
 * ```
 */
export function createPaneAdapters(config: AppConfig, environment: OfficeEnvironment): Adapters {
  return createAdapters(config, async () => {
    const { accessToken } = await acquireToken(config.entraClientId, environment);

    return accessToken;
  });
}

/**
 * Runs the pane's start-up sequence, in order, before the report page renders.
 *
 * A loader rather than an effect, and that is the substance of this step rather
 * than a detail. Every stage here is a precondition for the next -- there is no
 * settings call without a session, no session without a token, no token without
 * a host -- so the sequence has to complete before anything renders, or the user
 * watches a page assemble itself in stages and reflow under them. React Router
 * holds the transition in `loading` for exactly as long as this runs, which is
 * what puts the steps reel on screen for free.
 *
 * The order is: wait for Office.js, check the host and requirement set, read the
 * message and the user, sign in, trade the token for a session, fetch the
 * tenant's settings. Each result is written to its store as it lands, so a
 * failure half way leaves what did succeed readable rather than rolling back --
 * the error screen can then say who the user was.
 *
 * Failures split two ways. The three environment failures redirect to
 * {@link ROUTES.unsupported} with their code in the query string, because they
 * are not faults and a stack trace would be the wrong response. Everything else
 * is rethrown for the router's `errorElement`. Both halves are reported first --
 * the split decides which screen a user lands on, not whether anyone hears about
 * it -- and {@link captureError} takes the volume from the error's own
 * `logLevel`.
 *
 * @param config The configuration the app booted with.
 * @returns A React Router loader.
 *
 * @see {@link https://reactrouter.com/start/data/route-object#loader}
 *
 * @example
 * ```ts
 * { index: true, Component: ReportView, loader: createReportLoader(config) }
 * ```
 */
export function createReportLoader(config: AppConfig) {
  return async function reportLoader(): Promise<Response | null> {
    try {
      const { environment, message, user } = config.demo
        ? { environment: demoEnvironment, message: demoMessage, user: demoUser }
        : await readHost();

      useOfficeStore.getState().setOffice({ environment, message, user });

      const adapters = createPaneAdapters(config, environment);

      // In demo mode this returns a fixture without ever asking for a token,
      // which is what lets the whole flow be walked in a plain browser.
      const authToken = config.demo ? '' : (await acquireToken(config.entraClientId, environment)).accessToken;

      const authorization = await adapters.minerva.authorize({ authToken });

      useSessionStore.getState().setSession({ authorization, flow: environment.naaSupported ? 'naa' : 'dialog' });

      const settings = await adapters.minerva.getSettings({ userLanguage: user.language });

      useSettingsStore.getState().setSettings(settings);

      return null;
    } catch (error) {
      if (isUnsupported(error)) {
        // Reported like everything else, and at its own volume: the three
        // environment errors declare `logLevel: 'warn'`, so this is a warning in
        // Sentry and in the console rather than an error. Redirecting without
        // reporting was the one path out of this loader that left no trace at
        // all -- and "how many panes cannot run here" is exactly the number
        // worth having.
        captureError(error);

        return redirect(`${ROUTES.unsupported}?${REASON_PARAM}=${(error as MinervaError).code}`);
      }

      throw error;
    }
  };
}

/** Reads everything the host can tell the pane, once Office.js is ready. */
async function readHost() {
  const info = await waitForOffice();
  const environment = readEnvironment(info);

  // Both readers are synchronous and both throw if the gate has not run, which
  // is why they come after `readEnvironment` rather than beside it.
  return { environment, message: readCurrentMessage(), user: readCurrentUser() };
}
