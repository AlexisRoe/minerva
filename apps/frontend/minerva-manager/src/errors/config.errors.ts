import { MinervaError } from '@minerva/typescript-lib';

/**
 * The manager's errors around loading and reading the runtime configuration.
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
      reference: '253e989e-f663-45dd-8002-e9c24b42407b',
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
      reference: 'fa9668b4-82e3-4adc-b96d-a94b91191218',
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
      reference: '4abf539b-e8b2-4b8d-846c-d544d6c77553',
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
      reference: '5c58efd7-8501-44a3-9fd2-77d2f4530ffd',
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
      reference: '46ad6072-e11c-4fc2-bee4-c3ec44167844',
      code: 'ERR_005',
      message: 'Minerva could not start.',
      logLevel: 'fatal',
      payload: { hook: 'useConfig' },
      cause,
    });
  }
}
