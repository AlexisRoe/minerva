/**
 * The stages the api distinguishes, mirroring what `NODE_ENV` is set to by the
 * compose files and the CI workflow.
 */
export enum NodeEnvironment {
  /** Local machine or the `development` target of the Dockerfile. */
  Development = 'development',
  /** Under vitest, where nothing may reach a real backend. */
  Test = 'test',
  /** A deployed stage. Reaches Sentry as the environment tag. */
  Production = 'production',
}

/**
 * The levels Nest's logger knows, declared quietest-first.
 *
 * The order is load-bearing, not cosmetic: `EnvironmentService.logLevels` reads
 * `LOG_LEVEL` as a threshold and enables the tail of this enum from there, so
 * reordering the members changes what a configured level switches on.
 *
 * The values match Nest's own `LogLevel` union, which is what lets
 * `app.useLogger()` take these directly. That call is the compile-time tie: a
 * level renamed upstream breaks `main.ts` rather than silently never matching.
 *
 * @see https://docs.nestjs.com/techniques/logger#log-levels
 */
export enum LogLevel {
  /** Everything, including Nest's own route and dependency resolution chatter. */
  Verbose = 'verbose',
  /** Diagnostics useful while working on the service. */
  Debug = 'debug',
  /** Nest's default: lifecycle events worth seeing in a deployed log. */
  Log = 'log',
  /** Something is off but the request was still served. */
  Warn = 'warn',
  /** A request or a job failed. */
  Error = 'error',
  /** The process cannot continue -- boot-time configuration faults land here. */
  Fatal = 'fatal',
}
