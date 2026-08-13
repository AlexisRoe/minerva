import { IsBoolean, IsIn, IsNumber, IsUrl, Max, Min } from 'class-validator';

/**
 * The stages Sentry is willing to tag an event with. A local copy of
 * `NodeEnvironment`, since no application module may be loaded from here.
 */
export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

/**
 * What `Sentry.init` needs, once the environment has been proven to say it.
 *
 * Every field is required -- `readSentryEnvironment` applies the defaults first,
 * so the only question left here is whether the values are legal. Properties are
 * named after the `Sentry.init` options rather than the variables.
 */
export class SentryEnvironment {
  /**
   * Where Sentry sends events. `require_tld` is off so a self-hosted relay on an
   * internal hostname passes, which is why `require_protocol` has to be on.
   */
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  dsn: string;

  /** The stage tag every event carries, one of {@link NODE_ENVIRONMENTS}. */
  @IsIn(NODE_ENVIRONMENTS)
  environment: string;

  /** Share of transactions traced, `0` (none) through `1` (all). */
  @IsNumber()
  @Min(0)
  @Max(1)
  tracesSampleRate: number;

  /** Share of processes that profile, `0` through `1`. Multiplies with the above. */
  @IsNumber()
  @Min(0)
  @Max(1)
  profileSessionSampleRate: number;

  /** Whether `console` output is forwarded to Sentry as structured logs. */
  @IsBoolean()
  enableLogs: boolean;
}
