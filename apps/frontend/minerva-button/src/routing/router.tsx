import { createHashRouter, type RouteObject } from 'react-router';

import { restoreHistoryApi } from '../adapters/office';
import type { AppConfig } from '../config';
import { ConfirmationView, ErrorView, ReportView, UnsupportedView } from '../views';
import { createReportAction } from './actions/report.action';
import { PaneLayout } from './layout/pane-layout.component';
import { createReportLoader } from './loaders/report.loader';
import { ROUTES } from './routes';

/**
 * Builds the pane's screens as one tree under {@link PaneLayout}.
 *
 * A function of the configuration rather than a constant, because the index
 * route's loader needs it: a loader runs outside React and so cannot reach
 * `useConfig()`. Passing it in here keeps that the router's problem rather than
 * every loader's.
 *
 * Exported separately from the router so tests can mount the same tree through
 * `createMemoryRouter` -- a hash router in jsdom shares one global location and
 * leaks state between cases.
 *
 * @param config The configuration the app booted with.
 * @returns The route tree.
 *
 * @example
 * ```tsx
 * createMemoryRouter(createRoutes(configFixture));
 * ```
 */
export function createRoutes(config: AppConfig): RouteObject[] {
  return [
    {
      path: ROUTES.taskPane,
      Component: PaneLayout,
      errorElement: <ErrorView />,
      children: [
        { index: true, Component: ReportView, loader: createReportLoader(config) },
        {
          path: ROUTES.confirmation,
          Component: ConfirmationView,
          action: createReportAction(config),
        },
        { path: ROUTES.unsupported, Component: UnsupportedView },
        { path: ROUTES.error, Component: ErrorView },
        { path: '*', Component: ErrorView },
      ],
    },
  ];
}

/**
 * Builds the router the app runs on.
 *
 * Hash-based, not history-based: the pane is loaded from a static `index.html`
 * inside a host-controlled iframe, so there is no server to rewrite deep links
 * and no address bar to keep tidy. The hash also keeps the query string
 * `loadConfig` reads (`retry`, `demo`) untouched by navigation.
 *
 * @param config The configuration the app booted with.
 * @returns A router ready to hand to `<RouterProvider>`.
 *
 * @see {@link https://reactrouter.com/api/data-routers/createHashRouter}
 *
 * @example
 * ```tsx
 * <RouterProvider router={createRouter(config)} />
 * ```
 */
export function createRouter(config: AppConfig) {
  // `createHashRouter` reads `history.replaceState` immediately, and Office.js
  // will have removed it if the pane is open in a plain browser rather than in
  // Outlook -- which is how demo mode is meant to be run.
  restoreHistoryApi();

  return createHashRouter(createRoutes(config));
}
