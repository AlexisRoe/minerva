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
  /** The app's package name, e.g. `@minerva/manager`. */
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
    typeof candidate.sentryTracesSampleRate === 'number'
  );
}
