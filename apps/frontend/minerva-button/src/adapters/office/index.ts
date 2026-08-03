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
export type { OutlookMessage } from './office.types';
export { readCurrentMessage } from './utils/read-current-message.util';
