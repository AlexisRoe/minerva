/**
 * Small, domain-free type guards shared across the workspace.
 *
 * Anything here has to hold for every package: no knowledge of errors, jobs or
 * environment variables. A check that only makes sense for one of those belongs
 * next to it instead.
 */

/** Highest port number TCP allows. */
const MAX_PORT = 65535;

/**
 * True for values that can carry properties: objects and functions, but not `null`.
 *
 * `typeof null === 'object'` is the reason for the explicit null check, and
 * functions are included because `typeof` reports them separately even though
 * they hold properties like any other object.
 *
 * @example
 * ```ts
 * if (isObjectLike(value)) {
 *   const kind = value.kind;  // value is Record<string, unknown> here
 * }
 * ```
 */
export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return (typeof value === 'object' || typeof value === 'function') && value !== null;
}

/** True for a string holding something other than whitespace. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** True for an integer in the TCP port range, `1` to `65535`. */
export function isValidPort(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_PORT;
}
