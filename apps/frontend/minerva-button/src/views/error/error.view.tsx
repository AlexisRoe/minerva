import { type ReactElement, useEffect, useState } from 'react';
import { useRouteError } from 'react-router';

import { captureError } from '@/platform/sentry/utils/capture-error.util';
import { ErrorScreen } from './error-screen.component';

/**
 * The screen behind a failed loader, a failed action, and an unknown path.
 *
 * The router's `errorElement`, and the reason it needs one of its own: a loader
 * or action rejection never reaches a React error boundary. React Router catches
 * it before it can propagate through the tree, so {@link MinervaErrorBoundary}
 * would never see it and it would go unreported.
 *
 * Reporting therefore happens here, which is the only place it can -- and the
 * event id it produces is what the screen shows the user, so the report and the
 * number they quote are the same thing.
 *
 * Rendering is handed to {@link ErrorScreen}, shared with the boundary so a
 * loader failure and a render failure look the same to a user -- they cannot
 * tell which layer broke, and should not have to.
 *
 * @see {@link https://reactrouter.com/api/hooks/useRouteError}
 *
 * @example
 * ```tsx
 * { path: ROUTES.taskPane, Component: PaneLayout, errorElement: <ErrorView /> }
 * ```
 */
export function ErrorView(): ReactElement {
  const error = useRouteError();
  const [errorId, setErrorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (error === undefined || error === null) {
      return;
    }

    setErrorId(captureError(error));
  }, [error]);

  return <ErrorScreen error={error} errorId={errorId} />;
}
