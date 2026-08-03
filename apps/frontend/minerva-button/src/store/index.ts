/**
 * The task pane's client-side stores.
 *
 * Zustand, one folder per store. Nothing here talks to the network; a store is
 * for state that outlives a component tree, and in the error log's case outlives
 * the page itself.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 */

export { ERROR_LOG_LIMIT, ERROR_LOG_STORAGE_KEY, useErrorLogStore } from './error-log/error-log.store';
export type { ErrorLogState, LoggedError } from './error-log/error-log.types';
export { toLoggedError } from './error-log/error-log.util';
export type { UseErrorLog } from './error-log/hooks/use-error-log.hook';
export { useErrorLog } from './error-log/hooks/use-error-log.hook';
