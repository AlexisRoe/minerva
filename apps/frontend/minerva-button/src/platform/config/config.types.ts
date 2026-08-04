/**
 * The document the app fetches at start-up, as produced by the `runtimeConfig()`
 * Vite plugin in `vite.runtime-config.ts`.
 *
 * The first four fields are injected by the plugin for every app; the rest come
 * from this app's `config.entries.ts`, so the two files have to be changed
 * together -- adding an entry there without adding it here leaves the value
 * unreadable, and adding it here without adding it there makes every boot fail
 * the guard below.
 *
 * @see {@link https://vite.dev/guide/env-and-mode.html} -- why this is fetched rather than baked in via `import.meta.env`
 * @see {@link https://vite.dev/guide/assets.html#the-public-directory} -- how the emitted file is served
 */
export interface RuntimeConfig {
  /** The app's package name, e.g. `@minerva/button`. */
  readonly name: string;
  /** The app's package version. */
  readonly version: string;
  /** ISO timestamp of the build that emitted the document. */
  readonly buildTime: string;
  /** The Vite mode the bundle was built in, e.g. `production`. */
  readonly mode: string;
  /** Sentry DSN, or `null` when error reporting is switched off. */
  readonly sentryDsn: string | null;
  /** Share of transactions Sentry traces, `0` to `1`. */
  readonly sentryTracesSampleRate: number;
  /**
   * The host the task pane is allowed to run on, e.g. `button.minerva.example`.
   *
   * `null` switches the check in `src/session/` off, which is what local
   * development runs with.
   */
  readonly appDomain: string | null;
  /**
   * Whether this deployment honours `?demo=true`.
   *
   * `demo` arrives in a URL anyone can edit, so it cannot be the only thing
   * standing between a real deployment and a pane full of mock data. This is
   * the half a user cannot change: on for the environment the manager embeds
   * for a walkthrough, off everywhere else.
   */
  readonly allowDemo: boolean;
  /**
   * The Entra application (client) id the add-in signs in with.
   *
   * Runtime configuration rather than a constant because the same artefact is
   * deployed against different tenants, each with its own registration. It has
   * to match the `<Id>` in the manifest: NAA brokers the token through the
   * host, and the host will only broker for the application the manifest
   * declares.
   *
   * `null` switches sign-in off, which is the only state demo mode can run in --
   * a browser outside Outlook has nothing to acquire a token from.
   *
   * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in}
   */
  readonly entraClientId: string | null;
}

/**
 * The path the plugin publishes the document at.
 *
 * Deliberately duplicated from `CONFIG_PATH` in `vite.runtime-config.ts` rather
 * than imported: that module pulls in `node:fs` and `vite`, neither of which
 * belongs in a browser bundle.
 */
export const CONFIG_PATH = '/config.json';

/**
 * The configuration the app actually runs on: the deployed document plus what
 * the URL it was opened with says.
 *
 * The pane is launched by someone else -- Outlook, the auth dialog, the manager
 * embedding it in an iframe, our own retry link -- and the only channel any of
 * them has is the query string. It is read in the same step as the document,
 * and by the same code, so that there is one settings object, assembled once,
 * before React mounts and before anything reaches the network.
 */
export interface AppConfig extends RuntimeConfig {
  /** The host the app is served from, checked against {@link RuntimeConfig.appDomain}. */
  readonly host: string;
  /**
   * How often this pane has already been re-opened after a failure.
   *
   * `0` on a normal launch and never above {@link MAX_RETRY}: one retry is the
   * whole budget, so a bad message cannot bounce the pane in a loop.
   */
  readonly retry: number;
  /**
   * Whether the pane runs on mock data.
   *
   * Asked for with `?demo=true` and granted only where {@link
   * RuntimeConfig.allowDemo} is set, so the two halves -- the URL and the
   * deployment -- have to agree. Nothing may leave the browser while it is on: Sentry
   * is not initialised, Office.js is not started, and the API and Graph
   * adapters answer from fixtures. It is what lets the manager embed the pane
   * in an iframe to show it off.
   */
  readonly demo: boolean;
}

/** The `retry` query parameter. */
export const RETRY_PARAM = 'retry';

/** The `demo` query parameter. */
export const DEMO_PARAM = 'demo';

/**
 * The highest `retry` the app will ever report.
 *
 * A second attempt is worth making because the failures this covers are
 * start-up ones -- a token that had just expired, a dialog that closed early.
 * A third would only repeat the first two, so anything above this is clamped
 * rather than trusted; the value reaches us from a URL a user can edit.
 */
export const MAX_RETRY = 1;

/**
 * Narrows a parsed JSON document to a {@link RuntimeConfig}.
 *
 * Six fields do not justify a schema library. What this has to catch is a
 * deployment mistake -- a stale `config.json`, or an index page served in place
 * of a missing one -- so every field is checked rather than assumed.
 */
export function isRuntimeConfig(value: unknown): value is RuntimeConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === 'string' &&
    typeof candidate.version === 'string' &&
    typeof candidate.buildTime === 'string' &&
    typeof candidate.mode === 'string' &&
    (typeof candidate.sentryDsn === 'string' || candidate.sentryDsn === null) &&
    typeof candidate.sentryTracesSampleRate === 'number' &&
    (typeof candidate.appDomain === 'string' || candidate.appDomain === null) &&
    typeof candidate.allowDemo === 'boolean' &&
    (typeof candidate.entraClientId === 'string' || candidate.entraClientId === null)
  );
}
