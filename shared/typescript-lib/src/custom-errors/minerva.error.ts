import type {
  ErrorCode,
  ErrorLogLevel,
  ErrorReference,
  MinervaErrorProps,
  SerializedMinervaError,
} from './minerva.error.types';
import { BRAND_KEY, BRAND_VALUE, hasMinervaBrand, serializeCause } from './minerva.error.util';

/**
 * Base class for all Minerva errors, frontend and backend.
 *
 * @example Defining a new error — the whole subclass is the fixed `code`
 * ```ts
 * export class InvoiceNotFoundError extends MinervaError {
 *   constructor(invoiceId: string, cause?: Error) {
 *     super({
 *       code: 'ERR_042',
 *       reference: crypto.randomUUID(),
 *       message: 'This invoice does not exist.',
 *       status: 404,
 *       logLevel: 'warn',
 *       payload: { invoiceId },
 *       cause,
 *     });
 *   }
 * }
 * ```
 * Rules of thumb: one subclass per `code`, `code` never reused or renumbered
 * (it is a translation key and a Sentry fingerprint), `message` written for the
 * user, everything a developer needs in `payload`.
 *
 * @example Catching — one branch handles every Minerva error
 * ```ts
 * try {
 *   await loadInvoice(id);
 * } catch (e) {
 *   if (MinervaError.is(e)) {
 *     console.error(JSON.stringify(e));                    // structured log line
 *     const level = convertToSentryLevel(e.logLevel);
 *     Sentry.captureException(e, {
 *       level,
 *       tags: { code: e.code, reference: e.reference },  // indexed, searchable
 *       extra: e.payload,                                // not indexed
 *       fingerprint: [e.code],                           // group by code, not message
 *     });
 *
 *     return showToast(t(e.code));
 *   }
 *   throw e;
 * }
 * ```
 */
export class MinervaError extends Error {
  /** Unique error reference as uuid (v4), unique per throw. */
  readonly reference: ErrorReference;
  /** Unique error code always starting e.x. ERR_001. */
  readonly code: ErrorCode;
  /** HTTP Status code for error (useful in backend applications). */
  readonly status: number;
  /** Defines what happens for logging (console, Sentry, etc.). */
  readonly logLevel: ErrorLogLevel;
  /** Additional data the error should carry. Must stay JSON-safe and secret-free. */
  readonly payload?: Record<string, unknown>;

  constructor(props: MinervaErrorProps) {
    super(props.message, { cause: props.cause });

    this.reference = props.reference;
    this.code = props.code;
    this.status = props.status ?? 500;
    this.logLevel = props.logLevel ?? 'error';
    this.payload = props.payload;

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;

    /* Non-enumerable on purpose: the brand is plumbing, so it stays out of
       `JSON.stringify`, `Object.keys` and spreads, and cannot be reassigned. */
    Object.defineProperty(this, BRAND_KEY, {
      value: BRAND_VALUE,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  /**
   * Serialises the error for JSON logging.
   *
   * `JSON.stringify(error)` picks this up automatically. Without it the output
   * is near-useless: `message`, `stack` and `cause` are *non-enumerable* own
   * properties on `Error`, so a plain stringify drops exactly the fields you
   * wanted and keeps only the class fields.
   *
   * `payload` is passed through as-is, so it has to be JSON-safe — a cycle in
   * it makes `JSON.stringify` throw, and `bigint` throws too.
   *
   * `cause` is flattened to one level (`name`, `message`, `stack`). A
   * `MinervaError` used as a cause therefore logs without its `code` and
   * `payload`; put anything you need to keep in the outer error's `payload`.
   *
   * @example
   * ```ts
   * console.error(JSON.stringify(error));
   * // {"name":"InvoiceNotFoundError","code":"ERR_042","reference":"5c2c…",
   * //  "message":"This invoice does not exist.","status":404,"logLevel":"error",
   * //  "stack":"InvoiceNotFoundError: …","payload":{"invoiceId":"inv_1"}}
   * ```
   */
  toJSON(): SerializedMinervaError {
    return {
      name: this.name,
      code: this.code,
      reference: this.reference,
      message: this.message,
      status: this.status,
      logLevel: this.logLevel,
      stack: this.stack,
      payload: this.payload,
      cause: serializeCause(this.cause),
    };
  }

  /**
   * Narrows an `unknown` from a `catch` to a `MinervaError`, subclasses included.
   *
   * Checks the hidden `__brand` property rather than `instanceof` alone.
   * `instanceof` compares prototype identity, which fails whenever the error
   * crosses a realm (worker, iframe, vm context) or when two copies of this
   * package end up in one bundle — the error is a `MinervaError`, just not
   * *this* `MinervaError`. The brand is a plain string, so it survives both.
   *
   * It does not survive a structured clone or a JSON round-trip: neither keeps
   * non-enumerable properties or the prototype, so a deserialised error is not
   * a `MinervaError` and this returns `false`.
   *
   * @example
   * ```ts
   * catch (e) {
   *   if (MinervaError.is(e)) {
   *     return showToast(t(e.code));  // e is MinervaError here
   *   }
   *
   *   throw e;                        // never swallow what you did not throw
   * }
   * ```
   */
  static is(e: unknown): e is MinervaError {
    return e instanceof MinervaError || hasMinervaBrand(e);
  }
}
