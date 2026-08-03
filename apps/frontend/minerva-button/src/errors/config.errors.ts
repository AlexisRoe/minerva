import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors around loading and reading the runtime configuration.
 *
 * One subclass per {@link ErrorCode}, and one hard-coded `reference` per class:
 * the reference identifies the *throw site*, so it stays constant for a given
 * class and is generated once with `uuidgen` when the class is written -- never
 * at runtime, or a log line could no longer be traced back to a line of code.
 *
 * Every class registered here is listed in `errors.registry.ts`; add both
 * together, and never reuse or renumber a code -- it is an i18n key and a Sentry
 * fingerprint.
 *
 * @see {@link ../../../../shared/typescript-lib/src/custom-errors/minerva.error.ts} -- the base class
 */

/**
 * The runtime configuration could not be fetched.
 *
 * The document is emitted next to the bundle by the `runtimeConfig()` Vite
 * plugin, so a non-2xx response means it was not deployed alongside the app, or
 * the host is rewriting the path.
 */
export class ConfigRequestFailedError extends MinervaError {
  constructor(path: string, status: number, statusText: string, cause?: Error) {
    super({
      reference: 'e91cbf6e-e9a3-40d4-8817-f7f7cfbb9dce',
      code: 'ERR_001',
      message: 'Minerva could not load its configuration.',
      payload: { path, status, statusText },
      cause,
    });
  }
}

/**
 * The runtime configuration was served, but is not JSON.
 *
 * Usually a single-page-app fallback answering with `index.html` for a path the
 * deployment does not actually have.
 */
export class ConfigParseError extends MinervaError {
  constructor(path: string, cause?: Error) {
    super({
      reference: '6e0dbc53-2b79-495b-be63-7bb8a413fe95',
      code: 'ERR_002',
      message: 'Minerva could not read its configuration.',
      payload: { path },
      cause,
    });
  }
}

/**
 * The runtime configuration parsed, but does not match `RuntimeConfig`.
 *
 * A key was added to `config.entries.ts` without being added to
 * `config.types.ts`, or the deployed `config.json` is from an older build.
 */
export class ConfigInvalidError extends MinervaError {
  constructor(path: string, cause?: Error) {
    super({
      reference: 'ad3b814b-be43-4e32-b55f-cc0dda054290',
      code: 'ERR_003',
      message: 'Minerva could not read its configuration.',
      payload: { path },
      cause,
    });
  }
}

/**
 * `index.html` has no `#root`, so there is nowhere to mount React.
 *
 * A build or template fault rather than anything a user can act on.
 */
export class MissingRootElementError extends MinervaError {
  constructor(cause?: Error) {
    super({
      reference: '3347b99b-ec62-44cc-9d06-754a745f908c',
      code: 'ERR_004',
      message: 'Minerva could not start.',
      logLevel: 'fatal',
      payload: { elementId: 'root' },
      cause,
    });
  }
}

/**
 * `useConfig()` was called outside a `ConfigProvider`.
 *
 * Pure wiring: the bootstrap mounts the provider around the whole tree, so this
 * only fires for a component rendered outside it -- most often in a test.
 */
export class ConfigProviderMissingError extends MinervaError {
  constructor(cause?: Error) {
    super({
      reference: 'c61ad293-3681-43e0-b2df-a914d0615f67',
      code: 'ERR_005',
      message: 'Minerva could not start.',
      logLevel: 'fatal',
      payload: { hook: 'useConfig' },
      cause,
    });
  }
}

/**
 * The app is served from a host other than the configured `appDomain`.
 *
 * The task pane only ever runs on the host it was deployed to, so a mismatch
 * means the bundle was copied somewhere else or framed by a page it should not
 * be -- neither of which it should keep running under.
 */
export class ConfigDomainMismatchError extends MinervaError {
  constructor(expected: string, actual: string, cause?: Error) {
    super({
      reference: 'aea2bf1d-8ce5-4958-984c-5f628beaa129',
      code: 'ERR_006',
      message: 'Minerva is not allowed to run here.',
      logLevel: 'fatal',
      payload: { expected, actual },
      cause,
    });
  }
}
