/**
 * The manager's error catalogue.
 *
 * Nothing in this app throws a bare `Error`. Every failure it raises is a
 * {@link MinervaError} subclass defined here, which is what gives it a stable
 * `code` for translation and Sentry grouping, a `reference` pointing at the
 * throw site, and a JSON-serialisable `payload` for the log line.
 *
 * `errors.registry.ts` lists every code in use; read it first when picking the
 * next one.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/usage/} -- capturing these
 */

export {
  ConfigInvalidError,
  ConfigParseError,
  ConfigProviderMissingError,
  ConfigRequestFailedError,
  MissingRootElementError,
} from './config.errors';
export type { ErrorRegistryEntry, UsedErrorCode } from './errors.registry';
export { errorRegistry } from './errors.registry';
