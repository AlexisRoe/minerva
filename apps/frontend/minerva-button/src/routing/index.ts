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

export { PaneLayout } from './layout/pane-layout.component';
export { createRouter, routes } from './router';
export type { Route } from './routes';
export { ROUTES } from './routes';
