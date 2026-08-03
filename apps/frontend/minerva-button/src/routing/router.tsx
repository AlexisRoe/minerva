import { createHashRouter, type RouteObject } from 'react-router';

import { ConfirmationView, ErrorView, TaskPaneView } from '../views';
import { PaneLayout } from './layout/pane-layout.component';
import { ROUTES } from './routes';

/**
 * The pane's screens, as one tree under {@link PaneLayout}.
 *
 * Exported separately from the router so tests can mount the same tree through
 * `createMemoryRouter` -- a hash router in jsdom shares one global location and
 * leaks state between cases.
 */
export const routes: RouteObject[] = [
  {
    path: ROUTES.taskPane,
    Component: PaneLayout,
    errorElement: <ErrorView />,
    children: [
      { index: true, Component: TaskPaneView },
      { path: ROUTES.confirmation, Component: ConfirmationView },
      { path: ROUTES.error, Component: ErrorView },
      { path: '*', Component: ErrorView },
    ],
  },
];

/**
 * Builds the router the app runs on.
 *
 * Hash-based, not history-based: the pane is loaded from a static `index.html`
 * inside a host-controlled iframe, so there is no server to rewrite deep links
 * and no address bar to keep tidy. The hash also keeps the query string
 * `loadConfig` reads (`retry`, `demo`) untouched by navigation.
 *
 * @returns A router ready to hand to `<RouterProvider>`.
 *
 * @see {@link https://reactrouter.com/api/data-routers/createHashRouter}
 *
 * @example
 * ```tsx
 * <RouterProvider router={createRouter()} />
 * ```
 */
export function createRouter() {
  return createHashRouter(routes);
}
