import { useState } from 'react';
import { RouterProvider } from 'react-router';

import { useConfig } from './config';
import { I18nProvider } from './i18n';
import { createRouter } from './routing';

/**
 * The task-pane surface hosted inside Outlook.
 *
 * Nothing but wiring: the providers the whole tree needs, and the router that
 * decides which screen is on. The rest of the bootstrap -- configuration,
 * Sentry, the theme -- is in `main.tsx`, above this.
 *
 * The router is built from the configuration, because the start-up loader needs
 * it and a loader runs outside React. `useState` with an initialiser rather than
 * `useMemo`: this must be built exactly once and kept, and `useMemo` is a
 * performance hint React is allowed to discard -- rebuilding the router would
 * lose the pane's history and re-run the whole boot sequence.
 */
export function App() {
  const config = useConfig();
  const [router] = useState(() => createRouter(config));

  return (
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  );
}
