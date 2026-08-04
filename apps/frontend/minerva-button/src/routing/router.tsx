import { createHashRouter, type RouteObject } from 'react-router';

import { restoreHistoryApi } from '@/adapters/office/utils/restore-history-api.util';
import { ROUTES } from '@/constants/routes.constants';
import type { AppConfig } from '@/platform/config/config.types';
import { createReportAction } from '@/routing/actions/report.action';
import { PaneLayout } from '@/routing/layout/pane-layout.component';
import { createReportLoader } from '@/routing/loaders/report.loader';
import { ConfirmationView } from '@/views/confirmation/confirmation.view';
import { ErrorView } from '@/views/error/error.view';
import { ReportView } from '@/views/report/report.view';
import { UnsupportedView } from '@/views/unsupported/unsupported.view';

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
        { path: ROUTES.all, Component: ErrorView },
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
export function createRouter(config: AppConfig): ReturnType<typeof createHashRouter> {
  restoreHistoryApi();
  const routes = createRoutes(config);

  return createHashRouter(routes);
}
