import { IsBoolean, IsIn, IsNumber, IsUrl, Max, Min } from 'class-validator';

/**
 * The stages Sentry is willing to tag an event with.
 *
 * Deliberately a local copy of `NodeEnvironment` rather than an import of it:
 * this schema is validated before any application module may be loaded, and the
 * three strings are the contract with `.env`, not with the enum.
 */
export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

/**
 * What `Sentry.init` needs, once the environment has been proven to say it.
 *
 * Every field is required. A default is applied while reading (see
 * `readSentryEnvironment`), so by the time an instance exists the only question
 * left is whether the values are legal -- which keeps "unset" and "set to
 * nonsense" apart: the first is normal and silent, the second is a
 * misconfiguration worth a warning.
 *
 * Property names are the `Sentry.init` option names rather than the variable
 * names, because that is what a reader of `SentryService.setup` is looking at.
 */
export class SentryEnvironment {
  /**
   * Where Sentry sends events.
   *
   * `require_tld` is off so a self-hosted relay on an internal hostname passes;
   * `require_protocol` then has to be on, because without a tld to insist on,
   * `isUrl` happily reads any single word as a hostname.
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
