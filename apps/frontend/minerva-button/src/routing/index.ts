/**
 * The task pane's navigation.
 *
 * Three screens would not need a router; the loading behaviour does. React
 * Router's data APIs give one place where a screen's data can be awaited before
 * it renders, and {@link PaneLayout} turns that into a single spinner instead
 * of one per view. Nothing outside this folder imports `react-router` for
 * anything but its hooks.
 *
 * Paths live in `routes.ts` so a `navigate()` call cannot drift from a route
 * definition.
 *
 * @see {@link https://reactrouter.com/start/data/routing}
 */

export type { ReportIntent } from './actions/report.action';
export { createReportAction, readReportIntent } from './actions/report.action';
export { PaneLayout } from './layout/pane-layout.component';
export { createPaneAdapters, createReportLoader } from './loaders/report.loader';
export { createRouter, createRoutes } from './router';
export type { Route } from './routes';
export { REASON_PARAM, ROUTES } from './routes';
