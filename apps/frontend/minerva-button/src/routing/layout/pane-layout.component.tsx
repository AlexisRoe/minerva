import { LoadingIndicator, mixLanguages } from '@minerva/ui-lib';
import { Stack } from '@minerva/ui-lib/primitives';
import { useMemo } from 'react';
import { Outlet, useNavigation } from 'react-router';

import { InitialLoadingData } from '../../constants/initial-loading.constants';
import { ReportingLoadingData } from '../../constants/reporting-loading.constants';
import { ROUTES } from '../routes';

/**
 * The frame every screen renders inside, and the pane's loading indicator.
 *
 * This is the reason the pane runs a router at all: `useNavigation()` reports a
 * transition as `loading` for as long as the target route's `loader` is still
 * running, which is what lets a screen wait for its data without every view
 * carrying its own spinner. The layout holds the padding, so the views hold
 * nothing but their content.
 *
 * The waits here are long enough to need something said during them -- start-up
 * signs the user in and fetches settings, reporting uploads an email and sends
 * mail -- so the spinner is a reel naming each step rather than a circle. Which
 * reel depends on where the pane is *going* rather than where it is: the target
 * route's loader is the thing being waited on.
 *
 * @see {@link https://reactrouter.com/api/hooks/useNavigation}
 *
 * @example
 * ```tsx
 * { path: '/', Component: PaneLayout, children: [...] }
 * ```
 */
export function PaneLayout() {
  const { state, location } = useNavigation();

  const isReporting = location?.pathname === ROUTES.confirmation;

  // Drawn once per destination rather than per render: mixLanguages picks a
  // language at random for each step, so re-running it mid-wait would reshuffle
  // the reel under the reader.
  const steps = useMemo(() => mixLanguages(isReporting ? ReportingLoadingData : InitialLoadingData), [isReporting]);

  return (
    <Stack gap="sm" p="md">
      {state === 'idle' ? <Outlet /> : <LoadingIndicator steps={steps} />}
    </Stack>
  );
}
