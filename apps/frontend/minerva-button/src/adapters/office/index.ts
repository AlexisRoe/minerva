/**
 * The task pane's Office.js adapter.
 *
 * Office.js is a global installed by a script the host injects, not a module:
 * it exists only inside Outlook, it is not ready when this bundle is parsed,
 * and it is unavailable in tests. Everything that deals with those three facts
 * lives here, and nothing outside this folder reads the `Office` global.
 *
 * What leaves is a plain {@link OutlookMessage} and the hook that reads it, so
 * views can be rendered in jsdom and in Storybook.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/outlook/outlook-add-ins-overview}
 */

export type { CurrentMessageState } from './hooks/use-current-message.hook';
export { useCurrentMessage } from './hooks/use-current-message.hook';
export type { OfficeEnvironment, OfficeReadyInfo, OutlookMessage, OutlookUser } from './office.types';
export { readCurrentMessage } from './utils/read-current-message.util';
export { readCurrentUser } from './utils/read-current-user.util';
export {
  MAILBOX_REQUIREMENT_SET,
  NAA_REQUIREMENT_SET,
  readEnvironment,
} from './utils/read-environment.util';
export { OFFICE_READY_TIMEOUT_MS, waitForOffice } from './utils/wait-for-office.util';
