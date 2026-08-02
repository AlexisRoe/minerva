import { MinervaError } from '../custom-errors/minerva.error';
import type { ErrorCode, ErrorReference, SerializedMinervaError } from '../custom-errors/minerva.error.types';
import { isNonEmptyString, isObjectLike } from '../validators/validator.utils';

/** Property every `Result` is branded with, so recognising one need not rely on `instanceof`. */
export const RESULT_BRAND_KEY = '__brand';
/** The only value {@link RESULT_BRAND_KEY} is ever set to. */
export const RESULT_BRAND_VALUE = '__MinervaResult__';

/** The shape `Result#toJSON` produces — the brand is enumerable here, so it survives the round trip. */
export interface SerializedResult {
  /** Always {@link RESULT_BRAND_VALUE} — what {@link hasResultBrand} looks for. */
  __brand: typeof RESULT_BRAND_VALUE;
  /** `true` for a success, `false` for a failure. */
  successful: boolean;
  /** The success value, JSON-serialised. Absent on a failure. */
  value?: unknown;
  /** The failure error, JSON-serialised. Absent on a success. */
  error?: unknown;
}

/** True when `r` carries the {@link RESULT_BRAND_KEY} marker — realm-safe, unlike `instanceof`. */
export function hasResultBrand(r: unknown): boolean {
  return isObjectLike(r) && r[RESULT_BRAND_KEY] === RESULT_BRAND_VALUE;
}

/** True when `r` is a plain object with the full serialised `Result` shape. */
export function isSerializedResult(r: unknown): r is SerializedResult {
  return hasResultBrand(r) && typeof (r as SerializedResult).successful === 'boolean';
}

/**
 * Rebuilds an `Error` from whatever `JSON.stringify` left behind.
 *
 * A `MinervaError` serialises via its own `toJSON`, so anything carrying `code`,
 * `reference` and `message` comes back as a `MinervaError` — the *base* class,
 * never the original subclass, which JSON cannot preserve. Everything else
 * becomes a plain `Error`. Pass your own reviver to {@link Result.hydrate} when
 * the concrete subclass matters.
 */
export function reviveError(e: unknown): Error {
  if (!isObjectLike(e)) {
    return new Error(typeof e === 'string' ? e : 'Unknown error');
  }

  const { code, reference, message, name, status, logLevel, payload, stack } = e as Partial<SerializedMinervaError>;

  if (!isNonEmptyString(code) || !isNonEmptyString(reference) || !isNonEmptyString(message)) {
    return new Error(isNonEmptyString(message) ? message : 'Unknown error');
  }

  const revived = new MinervaError({
    code: code as ErrorCode,
    reference: reference as ErrorReference,
    message,
    status,
    logLevel,
    payload,
  });

  if (isNonEmptyString(name)) revived.name = name;
  if (isNonEmptyString(stack)) revived.stack = stack;

  return revived;
}
