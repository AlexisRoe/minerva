/** Severity for anything that does not carry one of its own. */
export const DEFAULT_LEVEL = 'error';

/** How many errors the log keeps before the oldest is dropped. */
export const ERROR_LOG_LIMIT = 25;

/** The `localStorage` key the log is persisted under. */
export const ERROR_LOG_STORAGE_KEY = 'minerva.button.error-log';
