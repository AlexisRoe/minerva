import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getErrorLogStorage } from './error-log.storage';
import type { ErrorLogState } from './error-log.types';
import { toLoggedError } from './error-log.util';

/** How many errors the log keeps before the oldest is dropped. */
export const ERROR_LOG_LIMIT = 25;

/** The `localStorage` key the log is persisted under. */
export const ERROR_LOG_STORAGE_KEY = 'minerva.button.error-log';

/**
 * A ring of the last {@link ERROR_LOG_LIMIT} errors, kept in `localStorage`.
 *
 * The task pane is opened inside Outlook, where the console is out of reach for
 * most of the people who hit a bug -- and Sentry is off entirely until a DSN is
 * deployed. This is the fallback: whatever went wrong is still on the machine
 * afterwards, ready for a debug page to show and for a user to read out. It
 * survives a reload and a task pane being closed and reopened, which is exactly
 * when the console does not.
 *
 * Fed by `captureError()` in `src/sentry/`, so nothing has to remember to log
 * separately. Newest first, and capped: a boot that fails on every retry would
 * otherwise fill the origin's storage quota with the same entry.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction} -- the store
 * @see {@link https://zustand.docs.pmnd.rs/integrations/persisting-store-data} -- the `persist` middleware
 *
 * @example Reading it in a component
 * ```tsx
 * const entries = useErrorLogStore((state) => state.entries);
 * ```
 *
 * @example Outside React
 * ```ts
 * useErrorLogStore.getState().log(error);
 * ```
 */
export const useErrorLogStore = create<ErrorLogState>()(
  persist(
    (set) => ({
      entries: [],

      log: (error: unknown) =>
        set((state) => ({
          entries: [toLoggedError(error, crypto.randomUUID(), new Date().toISOString()), ...state.entries].slice(
            0,
            ERROR_LOG_LIMIT,
          ),
        })),

      clear: () => set({ entries: [] }),
    }),
    {
      name: ERROR_LOG_STORAGE_KEY,
      storage: createJSONStorage(getErrorLogStorage),
      version: 1,
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
