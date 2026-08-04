import { BrandLogo, LoadingIndicator, mixLanguages, ReportButtonPage } from '@minerva/ui-lib';
import { useMemo } from 'react';
import { Outlet, useNavigation } from 'react-router';

import { LOGO_SIZE } from '../../constants/icon-sizes.constants';
import { InitialLoadingData } from '../../constants/initial-loading.constants';
import { ReportingLoadingData } from '../../constants/reporting-loading.constants';
import { ROUTES } from '../../constants/routes.constants';

/**
 * The frame every screen renders inside, and the pane's loading indicator.
 *
 * This is the reason the pane runs a router at all: `useNavigation()` reports a
 * transition as `loading` for as long as the target route's `loader` is still
 * running, which is what lets a screen wait for its data without every view
 * carrying its own spinner. It adds no padding of its own: every screen is a
 * `ReportButtonPage`, which brings its own.
 *
 * The waits here are long enough to need something said during them -- start-up
 * signs the user in and fetches settings, reporting uploads an email and sends
 * mail -- so the spinner is a reel naming each step rather than a circle. Which
 * reel depends on where the pane is *going* rather than where it is: the target
 * route's loader is the thing being waited on.
 *
 * The wait is drawn in the same frame as everything else, mark and all, so the
 * pane looks like itself from the first frame and only its content is missing.
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

  const steps = useMemo(() => mixLanguages(isReporting ? ReportingLoadingData : InitialLoadingData), [isReporting]);

  if (state === 'idle') {
    return <Outlet />;
  }

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <LoadingIndicator steps={steps} />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}
