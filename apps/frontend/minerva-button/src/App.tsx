import { type ReactElement, useMemo } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AsyncLoading } from '@/components/async-loading/async-loading.component';
import { ROUTES } from '@/constants/routes.constants';
import { createBootstrapLoader } from '@/loaders/bootstrap.loader';
import { createReportLoader } from '@/loaders/report.loader';
import { useAdapters } from '@/platform/config/hooks/use-adapters.hook';
import { ConfirmationView } from '@/views/confirmation/confirmation.view';
import { ErrorScreen } from '@/views/error/error-screen.component';
import { ReportView } from '@/views/report/report.view';

/**
 * The task-pane surface hosted inside Outlook.
 *
 * A {@link MemoryRouter} rather than a hash or browser router, because the pane
 * has no address bar and no server: it is a static `index.html` in a
 * host-controlled iframe, nobody types a path into it, and no deep link is ever
 * restored. Keeping the history in memory means the app never touches
 * `window.history` -- which Outlook is known to strip from the frame -- and
 * leaves the query string `loadConfig` reads (`retry`, `demo`) untouched by
 * navigation.
 *
 * Declarative routes rather than a data router. The two long waits are owned by
 * {@link AsyncLoading} instead of loaders and `useNavigation()`, which is what
 * collapses the pane's two error paths into one: an `errorElement` existed only
 * because a loader rejection can never reach a React boundary, and there are no
 * router loaders now. Everything fails into the `MinervaErrorBoundary` that
 * `main.tsx` mounts above this.
 *
 * Every provider sits above this too, alongside the rest of the bootstrap, which
 * leaves this file with exactly one job: naming the screens.
 *
 * @see {@link https://reactrouter.com/api/declarative-routers/MemoryRouter}
 *
 * @example
 * ```tsx
 * <ConfigProvider adapters={adapters} config={config}><App /></ConfigProvider>
 * ```
 */
export function App(): ReactElement {
  return (
    <MemoryRouter initialEntries={[ROUTES.taskPane]}>
      <Routes>
        <Route element={<ReportRoute />} path={ROUTES.taskPane} />
        <Route element={<ConfirmationRoute />} path={ROUTES.confirmation} />
        <Route element={<ErrorScreen error={undefined} />} path={ROUTES.all} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * The landing screen, behind the start-up sequence.
 *
 * The loader is memoised on the adapter set, whose identity is stable for the
 * lifetime of the pane, so the sequence runs once: a new loader on every render
 * would re-fire {@link AsyncLoading}'s effect and sign the user in again.
 */
function ReportRoute(): ReactElement {
  const adapters = useAdapters();
  const loader = useMemo(() => createBootstrapLoader(adapters), [adapters]);

  return (
    <AsyncLoading loader={loader}>
      <ReportView />
    </AsyncLoading>
  );
}

/**
 * The screen after a report, behind the reporting sequence.
 *
 * Same shape as {@link ReportRoute}, for a stronger reason: this loader files
 * the report, so a rebuilt loader would file it twice.
 */
function ConfirmationRoute(): ReactElement {
  const adapters = useAdapters();
  const loader = useMemo(() => createReportLoader(adapters), [adapters]);

  return (
    <AsyncLoading loader={loader} type="report">
      <ConfirmationView />
    </AsyncLoading>
  );
}
