import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { loadEnv, type Plugin } from 'vite';

/**
 * A `config.json` next to the bundle, fetched by the app at runtime.
 *
 * The alternative — `import.meta.env.VITE_*` — bakes every value into the
 * bundle at build time, so a new Sentry DSN means a new build. The settings in
 * here are read from the deployed file instead, which lets the same artefact be
 * promoted through the environments.
 *
 * The values come from the shared root `.env` locally and from the CI/CD
 * environment on a real build; both use the same `APP_FE_RB_`-style prefix, so
 * a variable that is set in the pipeline needs no change here.
 */
export const CONFIG_PATH = '/config.json';

/** One environment variable, and the config key it is published under. */
export interface ConfigEntry {
  /** Key in `config.json`, e.g. `sentryDsn`. */
  key: string;
  /** Environment variable to read, including its prefix. */
  env: string;
  /** Used when the variable is unset or empty. `null` means "no value". */
  fallback: string | number | boolean | null;
}

export interface RuntimeConfigOptions {
  /** Directory holding the `.env` — the repo root for every app here. */
  envDir: string;
  /** The app's `package.json`, for the name and version in the output. */
  packageJson: string;
  /** The stable env-var-to-config-key mapping. */
  entries: readonly ConfigEntry[];
}

type ConfigValue = string | number | boolean | null;

/**
 * Coerces the raw string from the environment to the type of its fallback, so
 * `APP_FE_RB_SENTRY_TRACES_SAMPLE_RATE=0.2` arrives as a number and not as
 * `"0.2"`. An unparseable value falls back rather than reaching the browser as
 * `NaN`.
 */
function coerce(raw: string, fallback: ConfigEntry['fallback']): ConfigValue {
  if (typeof fallback === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof fallback === 'boolean') {
    return raw === 'true' || raw === '1';
  }
  return raw;
}

function buildConfig(options: RuntimeConfigOptions, mode: string): string {
  // `loadEnv` reads the `.env` files *and* the real process environment, which
  // is what makes the CI/CD variables win over anything checked in locally.
  const env = loadEnv(mode, options.envDir, '');
  const pkg = JSON.parse(readFileSync(options.packageJson, 'utf8')) as {
    name: string;
    version: string;
  };

  const values: Record<string, ConfigValue> = {
    name: pkg.name,
    version: pkg.version,
    buildTime: new Date().toISOString(),
    mode,
  };

  for (const entry of options.entries) {
    const raw = env[entry.env];
    values[entry.key] = raw === undefined || raw === '' ? entry.fallback : coerce(raw, entry.fallback);
  }

  return `${JSON.stringify(values, null, 2)}\n`;
}

/**
 * Emits `config.json` into the build output and serves the same document from
 * the dev and preview servers, so the app has one way to read its settings in
 * every environment.
 */
export function runtimeConfig(options: RuntimeConfigOptions): Plugin {
  let mode = 'production';

  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const [path = ''] = (req.url ?? '').split('?');
    if (path !== CONFIG_PATH) {
      next();
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    // Rebuilt per request: editing `.env` then reloading the page is enough,
    // no dev server restart.
    res.end(buildConfig(options, mode));
  };

  return {
    name: 'minerva:runtime-config',
    configResolved(config) {
      mode = config.mode;
    },
    configureServer(server) {
      server.middlewares.use(serve);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        // An explicit `fileName` opts out of content hashing — the app fetches
        // this path literally, so it has to stay stable.
        fileName: CONFIG_PATH.slice(1),
        source: buildConfig(options, mode),
      });
    },
  };
}
