import { Center, Loader, Stack } from '@minerva/ui-lib/primitives';
import { Outlet, useNavigation } from 'react-router';

import { useTranslations } from '../../i18n';

/**
 * The frame every screen renders inside, and the pane's loading indicator.
 *
 * This is the reason the pane runs a router at all: `useNavigation()` reports a
 * transition as `loading` for as long as the target route's `loader` is still
 * running, which is what lets a screen wait for its data without every view
 * carrying its own spinner. The layout holds the padding, so the views hold
 * nothing but their content.
 *
 * @see {@link https://reactrouter.com/api/hooks/useNavigation}
 *
 * @example
 * ```tsx
 * { path: '/', Component: PaneLayout, children: [...] }
 * ```
 */
export function PaneLayout() {
  const { state } = useNavigation();
  const { t } = useTranslations();

  return (
    <Stack gap="sm" p="md">
      {state === 'idle' ? (
        <Outlet />
      ) : (
        <Center p="xl">
          <Loader aria-label={t('loading')} size="sm" />
        </Center>
      )}
    </Stack>
  );
}
