import { MinervaError } from '../custom-errors/minerva.error';
import type { SerializedResult } from './result.util';
import { hasResultBrand, isSerializedResult, RESULT_BRAND_KEY, RESULT_BRAND_VALUE, reviveError } from './result.util';

/**
 * What both outcomes share: the discriminant, the two fields, and the guards.
 *
 * Do not annotate with this — annotate with {@link Result}. A value typed as the
 * base is a single type the compiler cannot take apart, which is exactly the
 * narrowing the union exists to provide.
 */
export interface ResultBase<S, F extends Error> {
  /**
   * `true` on a success, `false` on a failure — the discriminant of the
   * {@link Result} union, and what lets the compiler pick the other outcome
   * once one of them has been ruled out.
   */
  readonly successful: boolean;
  /** The success value, or `undefined` on a failure. Narrow before reading it. */
  readonly value: S | undefined;
  /** The failure error, or `undefined` on a success. Narrow before reading it. */
  readonly error: F | undefined;

  /**
   * Narrows the result to a {@link SuccessResult}, making `value` type `S`.
   *
   * The `else` branch narrows too, to a {@link FailureResult} — the two guards
   * are interchangeable, so pick whichever one puts the interesting branch first.
   *
   * @example
   * ```ts
   * if (result.isSuccess()) {
   *   console.log(result.value);  // S
   * } else {
   *   throw result.error;         // F
   * }
   * ```
   */
  isSuccess(): this is SuccessResult<S, F>;

  /**
   * Narrows the result to a {@link FailureResult}, making `error` type `F`.
   *
   * Everything after an early return in the failure branch is a
   * {@link SuccessResult}: `value` is `S`, not `S | undefined`.
   *
   * @example
   * ```ts
   * if (result.isFailure()) {
   *   throw result.error;  // F
   * }
   *
   * return result.value;   // S — the failure has been ruled out
   * ```
   */
  isFailure(): this is FailureResult<S, F>;

  /**
   * Serialises the result, brand included, so {@link Result.hydrate} can rebuild it.
   *
   * @example
   * ```ts
   * JSON.stringify(Result.withSuccess(1));  // picks this up automatically
   * ```
   */
  toJSON(): SerializedResult;
}

/**
 * A `Result` known to be successful — `value` is present, `error` is `undefined`.
 *
 * You never construct this directly: `Result.withSuccess()` returns one, and
 * either guard narrows a {@link Result} to it.
 */
export interface SuccessResult<S, F extends Error = MinervaError> extends ResultBase<S, F> {
  readonly successful: true;
  readonly value: S;
  readonly error: undefined;
}

/**
 * A `Result` known to have failed — `error` is present, `value` is `undefined`.
 *
 * You never construct this directly: `Result.withFailure()` returns one, and
 * either guard narrows a {@link Result} to it.
 */
export interface FailureResult<S, F extends Error = MinervaError> extends ResultBase<S, F> {
  readonly successful: false;
  readonly value: undefined;
  readonly error: F;
}

/**
 * A success-or-failure return value, so a function can fail without throwing.
 *
 * Both halves are typed: `S` is what success carries, `F` is *which errors* the
 * caller has to handle — it defaults to {@link MinervaError} and is best given
 * as a union of concrete subclasses.
 *
 * It is a union of {@link SuccessResult} and {@link FailureResult}, which is what
 * makes narrowing work in *both* directions: ruling one outcome out leaves the
 * other, so `value` is `S` after a handled failure and `error` is `F` after a
 * handled success. Before narrowing, both are `| undefined` and the compiler
 * refuses to read them.
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
 * @example Consuming one — handle the failure, then use the value
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
export type Result<S, F extends Error = MinervaError> = SuccessResult<S, F> | FailureResult<S, F>;

/**
 * The one implementation behind both halves of the {@link Result} union.
 *
 * Exported as the value `Result`, which is where its statics are reached from —
 * `Result.withSuccess(…)`, `Result.hydrate(…)`. It is deliberately not the
 * *type* `Result`: a class is a single type, and the compiler cannot subtract a
 * failure from it, so annotating with it would cost the narrowing.
 */
export class MinervaResult<S, F extends Error = MinervaError> implements ResultBase<S, F> {
  /** `true` on a success, `false` on a failure. The union's discriminant. */
  readonly successful: boolean;
  /** The success value, or `undefined` on a failure. Narrow before reading it. */
  readonly value: S | undefined;
  /** The failure error, or `undefined` on a success. Narrow before reading it. */
  readonly error: F | undefined;

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
   * Narrows the result to a {@link FailureResult}, making `error` type `F` — and
   * everything past the branch a {@link SuccessResult}.
   *
   * @example
   * ```ts
   * if (result.isFailure()) {
   *   throw result.error;
   * }
   *
   * return result.value;
   * ```
   */
  isFailure(): this is FailureResult<S, F> {
    return !this.successful;
  }

  /**
   * Serialises the result, brand included, so {@link MinervaResult.hydrate} can rebuild it.
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
   * Narrows an `unknown` to a live {@link Result}.
   *
   * Checks the hidden brand as well as `instanceof`, because `instanceof`
   * compares prototype identity and fails whenever the result crosses a realm
   * (worker, iframe, vm context) or two copies of this package end up in one
   * bundle. A *serialised* result does not pass this — it has no methods, and
   * calling it a `Result` would be a lie; use {@link MinervaResult.hydrate} on
   * it first, or {@link isSerializedResult} to test it.
   *
   * @example
   * ```ts
   * if (Result.is(input)) {
   *   return input.isSuccess() ? input.value : input.error;
   * }
   * ```
   */
  static is(r: unknown): r is Result<unknown, Error> {
    return (
      r instanceof MinervaResult ||
      (hasResultBrand(r) && typeof (r as ResultBase<unknown, Error>).isSuccess === 'function')
    );
  }

  /**
   * Rebuilds a {@link Result} from a JSON string or an already-parsed payload.
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
      ? MinervaResult.withSuccess<S, F>(...([parsed.value as S] as [S]))
      : MinervaResult.withFailure<S, F>(reviver(parsed.error));
  }

  /**
   * Creates a successful result carrying `value`.
   *
   * The return type is the narrowed {@link SuccessResult}, so a caller that
   * builds one here and reads it straight back never has to narrow. For a
   * function that succeeds with nothing to report, call it as
   * `Result.withSuccess()` — `S` is then `void`.
   *
   * @example
   * ```ts
   * const ok = Result.withSuccess<number, MinervaError>(42);
   * ok.value;  // number, no guard needed
   * ```
   */
  static withSuccess<S = void, F extends Error = MinervaError>(
    ...[value]: undefined extends S ? [value?: S] : [value: S]
  ): SuccessResult<S, F> {
    return new MinervaResult<S, F>(true, value as S, undefined) as SuccessResult<S, F>;
  }

  /**
   * Creates a failed result carrying `error`.
   *
   * @example
   * ```ts
   * const failed = Result.withFailure(new InvoiceNotFoundError('inv_1'));
   * failed.error.code;  // typed, no guard needed
   * ```
   */
  static withFailure<S = never, F extends Error = MinervaError>(error: F): FailureResult<S, F> {
    return new MinervaResult<S, F>(false, undefined, error) as FailureResult<S, F>;
  }
}

/**
 * The `Result` value: `Result.withSuccess`, `Result.withFailure`, `Result.is`
 * and `Result.hydrate`, alongside the type of the same name.
 *
 * A type alias and a `const` live in different declaration spaces, so `Result`
 * can be the union in type position and the {@link MinervaResult} class in value
 * position — the same ergonomics as before the union split, with narrowing that
 * now works from either guard.
 *
 * @example
 * ```ts
 * const result: Result<number> = Result.withSuccess(42);
 * ```
 */
export const Result = MinervaResult;
