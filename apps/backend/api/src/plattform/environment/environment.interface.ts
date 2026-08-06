import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsUrl, Max, Min } from 'class-validator';

import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';

/**
 * Everything the api reads out of its environment, and the rules each value has
 * to satisfy before the process is allowed to finish booting.
 *
 * Property names are the variable names, because this class is validated
 * against `process.env` itself -- see `validateEnvironment`. Every value
 * arriving there is a string (or `undefined`), so anything that is not a string
 * carries a `@Type` telling `class-transformer` what to convert it to first;
 * validating before converting would reject `API_PORT=3000` for not being a
 * number.
 *
 * `@IsOptional` is the switch that decides what a *missing* variable means, and
 * it is the only thing this class says about defaults. Marked optional, an
 * absent variable passes and `EnvironmentService` decides what to hand out in
 * its place; left required, an absent variable fails the boot. A malformed
 * variable fails either way -- optional means "may be absent", never "may be
 * wrong".
 *
 * The names are deliberately unprefixed. `.env` namespaces per service
 * (`BE_API_PORT`, `BE_API_SENTRY_DSN`) and `infra/docker/docker-compose.api.yml`
 * maps those onto the names below, so one `.env` can configure every service
 * without any of them knowing about the others.
 *
 * @see https://docs.nestjs.com/techniques/configuration#custom-validate-function
 */
export class EnvironmentVariables {
  /**
   * Which stage this process thinks it is running on.
   *
   * Reaches Sentry as the environment tag, so a staging incident is not filed
   * under production.
   */
  @IsOptional()
  @IsEnum(NodeEnvironment)
  NODE_ENV?: NodeEnvironment;

  /** The quietest level Nest's logger still prints. */
  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel;

  /**
   * The port the Nest process listens on.
   *
   * Container-internal: Caddy is the only client. The port published to the
   * host is `BE_API_PORT`, which the api never sees.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  API_PORT?: number;

  /**
   * Where Sentry sends events, or absent to disable reporting entirely.
   *
   * Optional because that is the normal case locally, and because an api that
   * refuses to boot without an observability backend is worse than one that
   * boots without it.
   *
   * `require_tld` is off so a self-hosted relay on an internal hostname passes;
   * `require_protocol` then has to be on, because without a tld to insist on,
   * `isUrl` happily reads any single word as a hostname.
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  SENTRY_DSN?: string;

  /** Share of transactions Sentry traces, `0` (none) through `1` (all). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  SENTRY_TRACES_SAMPLE_RATE?: number;
}

/**
 * The values available to stand in for a variable the environment does not set.
 *
 * `satisfies Partial<EnvironmentVariables>` is what makes this worth having: a
 * default has to be spelled in the type the schema declares, so `API_PORT` is
 * the number `3000` here rather than the string the environment would have
 * supplied, and renaming a variable or changing its type breaks this constant
 * in the same commit. `as const` then keeps the literal types, so a getter
 * returning one of these narrows properly.
 *
 * Listing a value here does *not* apply it. `EnvironmentService` decides that
 * per variable, which is where a default is actually a judgement call: a port
 * can sensibly fall back, a DSN can be absent and mean "reporting off", and a
 * credential should have no entry here at all so that its absence fails the
 * boot instead.
 *
 * @example
 * ```ts
 * get apiPort(): number {
 *   return this.configService.get('API_PORT', { infer: true }) ?? ENVIRONMENT_DEFAULTS.API_PORT;
 * }
 * ```
 */
export const ENVIRONMENT_DEFAULTS = {
  NODE_ENV: NodeEnvironment.Development,
  LOG_LEVEL: LogLevel.Log,
  API_PORT: 3000,
  SENTRY_TRACES_SAMPLE_RATE: 0,
} as const satisfies Partial<EnvironmentVariables>;
