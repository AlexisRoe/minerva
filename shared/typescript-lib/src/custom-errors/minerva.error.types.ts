/** A single decimal character — the building block of {@link ErrorCode}. */
export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/** Stable, user-facing error code. Doubles as the i18n key: `ERR_001`. */
export type ErrorCode = `ERR_${Digit}${Digit}${Digit}`;

/** A uuid (v4), unique per *throw* — the handle for tracing one incident. */
export type ErrorReference = `${string}-${string}-${string}-${string}-${string}`;

/** How loudly this error should be reported */
export type ErrorLogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error' | 'fatal';

/** Everything the `MinervaError` constructor takes. */
export type MinervaErrorProps = {
  /** Unique error uuid for internal reference. Generate with `crypto.randomUUID()`. */
  reference: ErrorReference;
  /** Unique error code used for translations and displaying to users. */
  code: ErrorCode;
  /** User facing message explaining whats wrong. Never put secrets or PII here. */
  message: string;
  /** Http status, in frontend application can stay at 500. Default: `500`. */
  status?: number;
  /** An error log level for analytics and observability. Default: `'error'`. */
  logLevel?: ErrorLogLevel;
  /** Additional data which should be logged or sent to Sentry */
  payload?: Record<string, unknown>;
  /** If you want to throw an error because of another, cause should keep that. */
  cause?: Error;
};

/** A `cause` flattened to one serialisable level. */
export type Cause = { name: string; message: string; stack?: string };

/** The shape `MinervaError#toJSON` produces — one JSON log line. */
export interface SerializedMinervaError {
  /** Error name */
  name: string;
  /** Unique error code e.x. ERR_001 */
  code: ErrorCode;
  /** Unique error reference hinting where it was thrown */
  reference: ErrorReference;
  /** Error message */
  message: string;
  /** HTTP response status code */
  status: number;
  /** LogLevel for console.log or Sentry */
  logLevel: ErrorLogLevel;
  /** Error stack if existing */
  stack?: string;
  /** Additional data for logging or analytics */
  payload?: Record<string, unknown>;
  /** Original error causing this one to be thrown */
  cause?: Cause;
}
