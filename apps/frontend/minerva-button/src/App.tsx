import { RouterProvider } from 'react-router';

import { I18nProvider } from './i18n';
import { createRouter } from './routing';

/** Built once, at module scope: a router rebuilt on render loses its history. */
const router = createRouter();

/**
 * The task-pane surface hosted inside Outlook.
 *
 * Nothing but wiring: the providers the whole tree needs, and the router that
 * decides which screen is on. The rest of the bootstrap -- configuration,
 * Sentry, the theme -- is in `main.tsx`, above this.
 */
export function App() {
  return (
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  );
}
