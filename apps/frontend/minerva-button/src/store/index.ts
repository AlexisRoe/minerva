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
export type { UseOffice } from './office/hooks/use-office.hook';
export { useOffice } from './office/hooks/use-office.hook';
export { useOfficeStore } from './office/office.store';
export type { OfficeState } from './office/office.types';
export type { UseSession } from './session/hooks/use-session.hook';
export { useSession } from './session/hooks/use-session.hook';
export { useSessionStore } from './session/session.store';
export type { SessionState } from './session/session.types';
export type { UseSettings } from './settings/hooks/use-settings.hook';
export { useSettings } from './settings/hooks/use-settings.hook';
export { useSettingsStore } from './settings/settings.store';
export type { ReportVariant, SettingsState } from './settings/settings.types';
