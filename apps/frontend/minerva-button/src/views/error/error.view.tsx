import { Button, Text, Title } from '@minerva/ui-lib/primitives';
import { useNavigate, useRouteError } from 'react-router';

import { useTranslations } from '../../i18n';
import { ROUTES } from '../../routing';
import { captureError } from '../../sentry';

/**
 * The screen behind a failed submission, an unknown path, and a thrown route.
 *
 * It doubles as the router's `errorElement`, which is why it reads
 * `useRouteError()`: navigated to directly there is nothing to read, and the
 * user only ever sees the same message. What is not shown is reported --
 * `SentryErrorBoundary` in `main.tsx` never sees an error the router caught, so
 * this is the only place it can be captured.
 *
 * @see {@link https://reactrouter.com/api/hooks/useRouteError}
 *
 * @example
 * ```tsx
 * { path: ROUTES.error, Component: ErrorView }
 * ```
 */
export function ErrorView() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const routeError = useRouteError();

  if (routeError) {
    captureError(routeError);
  }

  return (
    <>
      <Title order={2}>{t('error-title')}</Title>
      <Text c="dimmed" size="sm">
        {t('error')}
      </Text>
      <Button onClick={() => void navigate(ROUTES.taskPane)} variant="light">
        {t('back')}
      </Button>
    </>
  );
}
