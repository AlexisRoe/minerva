import { type ReactElement, useState } from 'react';
import { RouterProvider } from 'react-router';

import { useConfig } from '@/platform/config/hooks/use-config.hook';
import { createRouter } from '@/routing/router';

/**
 * The task-pane surface hosted inside Outlook.
 *
 * Nothing but the router that decides which screen is on. Every provider now
 * sits above this in `main.tsx`, alongside the rest of the bootstrap --
 * configuration, Sentry and the theme -- which leaves this file with exactly one
 * job and makes it mountable in a test with nothing but a `ConfigProvider`.
 *
 * The router is built from the configuration, because the start-up loader needs
 * it and a loader runs outside React. `useState` with an initialiser rather than
 * `useMemo`: this must be built exactly once and kept, and `useMemo` is a
 * performance hint React is allowed to discard -- rebuilding the router would
 * lose the pane's history and re-run the whole boot sequence.
 */
export function App(): ReactElement {
  const config = useConfig();
  const [router] = useState(() => createRouter(config));

  return <RouterProvider router={router} />;
}
