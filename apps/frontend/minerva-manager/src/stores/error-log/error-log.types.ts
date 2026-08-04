import type { SerializedMinervaError } from '@minerva/typescript-lib';

/**
 * One error as it is kept in the log.
 *
 * A `MinervaError` contributes its own `toJSON()` shape; everything else is
 * flattened into the same fields so the debug page has one thing to render.
 * `loggedAt` is added here because an error carries no timestamp of its own, and
 * "when did this happen" is the first question asked of a log.
 *
 * Everything in here must survive `JSON.stringify` -- it is written to
 * `localStorage` -- which is why `payload` is whatever the error already
 * declared as JSON-safe and nothing is stored by reference.
 */
export interface LoggedError extends Partial<SerializedMinervaError> {
  /** Identifies this entry in a list; unrelated to the error's `reference`. */
  readonly id: string;
  /** ISO timestamp of when the error was captured. */
  readonly loggedAt: string;
  /** Error name, e.g. `ConfigRequestFailedError` or `TypeError`. */
  readonly name: string;
  /** Whatever the error said, or a rendering of a thrown non-error. */
  readonly message: string;
}

/** The state and actions {@link useErrorLogStore} exposes. */
export interface ErrorLogState {
  /** The kept errors, newest first. */
  readonly entries: readonly LoggedError[];
  /** Records an error, evicting the oldest once the log is full. */
  readonly log: (error: unknown) => void;
  /** Empties the log, in storage as well as in memory. */
  readonly clear: () => void;
}
