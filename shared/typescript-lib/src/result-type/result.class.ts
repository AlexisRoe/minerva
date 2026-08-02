import { MinervaError } from '../custom-errors/minerva.error';
import type { SerializedResult } from './result.util';
import { hasResultBrand, isSerializedResult, RESULT_BRAND_KEY, RESULT_BRAND_VALUE, reviveError } from './result.util';

/**
 * A `Result` known to be successful — `value` is present, `error` is `undefined`.
 *
 * You never construct this directly; `isSuccess()` narrows a `Result` to it.
 */
export interface SuccessResult<S, F extends Error> extends Result<S, F> {
  readonly value: S;
  readonly error: undefined;
}

/**
 * A `Result` known to have failed — `error` is present, `value` is `undefined`.
 *
 * You never construct this directly; `isFailure()` narrows a `Result` to it.
 */
export interface FailureResult<S, F extends Error> extends Result<S, F> {
  readonly value: undefined;
  readonly error: F;
}

/**
 * A success-or-failure return value, so a function can fail without throwing.
 *
 * Both halves are typed: `S` is what success carries, `F` is *which errors* the
 * caller has to handle — it defaults to {@link MinervaError} and is best given
 * as a union of concrete subclasses. Narrow with `isSuccess()` / `isFailure()`;
 * only after narrowing are `value` and `error` non-`undefined`.
 *
 * @example Returning one
 * ```ts
 * function loadInvoice(id: string): Result<Invoice, InvoiceNotFoundError> {
 *   const invoice = invoices.get(id);
 *
 *   return invoice
 *     ? Result.withSuccess(invoice)
 *     : Result.withFailure(new InvoiceNotFoundError(id));
 * }
 * ```
 *
 * @example Consuming one — the compiler forces the failure branch
 * ```ts
 * const result = loadInvoice('inv_1');
 *
 * if (result.isFailure()) {
 *   return showToast(t(result.error.code));  // error: InvoiceNotFoundError
 * }
 *
 * render(result.value);                      // value: Invoice
 * ```
 */
export class Result<S, F extends Error = MinervaError> {
  /** The success value, or `undefined` on a failure. Narrow before reading it. */
  readonly value: S | undefined;
  /** The failure error, or `undefined` on a success. Narrow before reading it. */
  readonly error: F | undefined;

  private readonly successful: boolean;

  private constructor(successful: boolean, value: S | undefined, error: F | undefined) {
    this.successful = successful;
    this.value = value;
    this.error = error;

    /* Non-enumerable on purpose: the brand is plumbing, so it stays out of
       `Object.keys` and spreads, and cannot be reassigned. `toJSON` writes it
       back in explicitly, which is what lets `hydrate` trust its input. */
    Object.defineProperty(this, RESULT_BRAND_KEY, {
      value: RESULT_BRAND_VALUE,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    Object.freeze(this);
  }

  /**
   * Narrows the result to a {@link SuccessResult}, making `value` type `S`.
   *
   * @example
   * ```ts
   * if (result.isSuccess()) {
   *   console.log(result.value);
   * }
   * ```
   */
  isSuccess(): this is SuccessResult<S, F> {
    return this.successful;
  }

  /**
   * Narrows the result to a {@link FailureResult}, making `error` type `F`.
   *
   * @example
   * ```ts
   * if (result.isFailure()) {
   *   throw result.error;
   * }
   * ```
   */
  isFailure(): this is FailureResult<S, F> {
    return !this.successful;
  }

  /**
   * Serialises the result, brand included, so {@link Result.hydrate} can rebuild it.
   *
   * `JSON.stringify(result)` picks this up automatically. The brand is written
   * back in here on purpose — on the instance it is non-enumerable, and a plain
   * stringify would drop the one marker that makes the payload recognisable.
   *
   * `value` has to be JSON-safe; an `error` is serialised by whatever `toJSON`
   * it has, which for a {@link MinervaError} is its full structured shape.
   *
   * @example
   * ```ts
   * JSON.stringify(Result.withSuccess({ id: 'inv_1' }));
   * // {"__brand":"__MinervaResult__","successful":true,"value":{"id":"inv_1"}}
   * ```
   */
  toJSON(): SerializedResult {
    return {
      [RESULT_BRAND_KEY]: RESULT_BRAND_VALUE,
      successful: this.successful,
      value: this.value,
      error: this.error,
    };
  }

  /**
   * Narrows an `unknown` to a live `Result`.
   *
   * Checks the hidden brand as well as `instanceof`, because `instanceof`
   * compares prototype identity and fails whenever the result crosses a realm
   * (worker, iframe, vm context) or two copies of this package end up in one
   * bundle. A *serialised* result does not pass this — it has no methods, and
   * calling it a `Result` would be a lie; use {@link Result.hydrate} on it
   * first, or {@link isSerializedResult} to test it.
   *
   * @example
   * ```ts
   * if (Result.is(input)) {
   *   return input.isSuccess() ? input.value : input.error;
   * }
   * ```
   */
  static is(r: unknown): r is Result<unknown, Error> {
    return r instanceof Result || (hasResultBrand(r) && typeof (r as Result<unknown>).isSuccess === 'function');
  }

  /**
   * Rebuilds a `Result` from a JSON string or an already-parsed payload.
   *
   * Throws a `TypeError` on anything that is not a serialised result, so a
   * hydrated value is a real `Result` with working methods. The generics are
   * unchecked assertions — JSON carries no types, so `hydrate<Invoice>` claims
   * a shape rather than verifying one. Validate `value` yourself if it came
   * from outside your own system.
   *
   * A failure's `error` is revived by `reviveError`: a serialised
   * {@link MinervaError} returns as a `MinervaError`, never as the original
   * subclass. Pass `reviver` when the subclass matters.
   *
   * @example
   * ```ts
   * const wire = JSON.stringify(loadInvoice('inv_1'));
   * const result = Result.hydrate<Invoice, InvoiceNotFoundError>(
   *   wire,
   *   (e) => new InvoiceNotFoundError((e as SerializedMinervaError).payload?.invoiceId as string),
   * );
   *
   * result.isFailure();  // true — and result.error is an InvoiceNotFoundError
   * ```
   */
  static hydrate<S = unknown, F extends Error = MinervaError>(
    input: unknown,
    reviver: (error: unknown) => F = reviveError as (error: unknown) => F,
  ): Result<S, F> {
    const parsed = typeof input === 'string' ? (JSON.parse(input) as unknown) : input;

    if (!isSerializedResult(parsed)) {
      throw new TypeError('Cannot hydrate: the value is not a serialized Result.');
    }

    return parsed.successful
      ? Result.withSuccess<S, F>(...([parsed.value as S] as [S]))
      : Result.withFailure<S, F>(reviver(parsed.error));
  }

  /**
   * Creates a successful result carrying `value`.
   *
   * For a function that succeeds with nothing to report, call it as
   * `Result.withSuccess()` — `S` is then `void`.
   *
   * @example
   * ```ts
   * const ok = Result.withSuccess<number, MinervaError>(42);
   * ok.isSuccess();  // true
   * ```
   */
  static withSuccess<S = void, F extends Error = MinervaError>(
    ...[value]: undefined extends S ? [value?: S] : [value: S]
  ): Result<S, F> {
    return new Result<S, F>(true, value as S, undefined);
  }

  /**
   * Creates a failed result carrying `error`.
   *
   * @example
   * ```ts
   * const failed = Result.withFailure(new InvoiceNotFoundError('inv_1'));
   * failed.isFailure();  // true
   * ```
   */
  static withFailure<S = never, F extends Error = MinervaError>(error: F): Result<S, F> {
    return new Result<S, F>(false, undefined, error);
  }
}
