import { useCallback } from 'react';

import { useErrorLogStore } from '../error-log.store';
import type { LoggedError } from '../error-log.types';

/** What {@link useErrorLog} returns. */
export interface UseErrorLog {
  /** The kept errors, newest first. */
  readonly entries: readonly LoggedError[];
  /** Whether anything has been logged. */
  readonly hasEntries: boolean;
  /** Empties the log, in storage as well as in memory. */
  readonly clear: () => void;
}

/**
 * Reads the persisted error log.
 *
 * The read side of {@link useErrorLogStore}, meant for the debug page: it
 * subscribes to the entries and to nothing else, so a component using it
 * re-renders when an error is logged and not when anything else in the store
 * moves. Writing is deliberately not exposed -- errors reach the log through
 * `captureError()`, which is what keeps the log and Sentry showing the same
 * thing.
 *
 * @returns The entries, whether there are any, and a way to clear them.
 *
 * @see {@link https://zustand.docs.pmnd.rs/guides/updating-state} -- selectors and re-renders
 *
 * @example
 * ```tsx
 * const { entries, hasEntries, clear } = useErrorLog();
 *
 * if (!hasEntries) return <Text>No errors recorded.</Text>;
 * return <Button onClick={clear}>Clear {entries.length} errors</Button>;
 * ```
 */
export function useErrorLog(): UseErrorLog {
  const entries = useErrorLogStore((state) => state.entries);
  const clearEntries = useErrorLogStore((state) => state.clear);

  const clear = useCallback(() => clearEntries(), [clearEntries]);

  return { entries, hasEntries: entries.length > 0, clear };
}
