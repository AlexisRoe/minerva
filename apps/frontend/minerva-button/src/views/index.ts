/**
 * The task pane's screens.
 *
 * One folder per screen, each holding the view and whatever is only ever
 * rendered by it. A view composes adapters and shared components; it never
 * calls `fetch`, reads the `Office` global or knows a URL -- those live one
 * layer down in `src/adapters/`, which is what keeps a screen renderable in
 * jsdom without a host.
 *
 * The routes that mount them are in `src/routing/`.
 */

export { ConfirmationView } from './confirmation/confirmation.view';
export { ErrorView } from './error/error.view';
export { TaskPaneView } from './task-pane/task-pane.view';
