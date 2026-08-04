import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { InitialLoadingData } from '../../constants/initial-loading.constants';
import { ReportingLoadingData } from '../../constants/reporting-loading.constants';
import { ROUTES } from '../routes';
import { PaneLayout } from './pane-layout.component';

/** Every string either reel can show, so a test can ask which one is on. */
function stepsOf(data: typeof InitialLoadingData): string[] {
  return Object.values(data).flatMap((translation) => translation.steps);
}

/**
 * Mounts the layout with two child screens and a loader that can be held open.
 *
 * The loading state is only observable mid-transition, so the target route's
 * loader is a promise the test resolves when it is ready.
 */
function renderLayout() {
  let release: () => void = () => undefined;
  const held = new Promise<null>((resolve) => {
    release = () => resolve(null);
  });

  const router = createMemoryRouter([
    {
      path: ROUTES.taskPane,
      Component: PaneLayout,
      children: [
        {
          index: true,
          element: (
            <>
              <p>screen</p>
              <Link to={ROUTES.confirmation}>go</Link>
            </>
          ),
        },
        { path: ROUTES.confirmation, element: <p>confirmed</p>, loader: () => held },
      ],
    },
  ]);

  const result = render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );

  return { ...result, release };
}

describe('PaneLayout', () => {
  it('renders the active screen while navigation is idle', async () => {
    renderLayout();

    expect(await screen.findByText('screen')).toBeInTheDocument();
  });

  it('draws the wait in the pane frame, mark and all', async () => {
    const { release } = renderLayout();

    await userEvent.click(await screen.findByRole('link', { name: 'go' }));

    // The pane should look like itself from the first frame, with only its
    // content missing -- not like a bare spinner on an empty page.
    expect(await screen.findByText('Minerva')).toBeInTheDocument();

    release();
  });

  it('shows the reporting reel while the report is being filed', async () => {
    const { release } = renderLayout();

    await userEvent.click(await screen.findByRole('link', { name: 'go' }));

    // Which reel is shown follows the *destination*, since the target route's
    // loader is what is being waited on.
    const reporting = stepsOf(ReportingLoadingData);

    await waitFor(() => {
      const shown = screen.getAllByText((text) => reporting.includes(text));

      expect(shown.length).toBeGreaterThan(0);
    });

    release();
    expect(await screen.findByText('confirmed')).toBeInTheDocument();
  });

  it('draws steps that all come from the same reel', async () => {
    const { release } = renderLayout();

    await userEvent.click(await screen.findByRole('link', { name: 'go' }));

    const initial = stepsOf(InitialLoadingData);
    const reporting = stepsOf(ReportingLoadingData);

    await waitFor(() => {
      expect(screen.getAllByText((text) => reporting.includes(text)).length).toBeGreaterThan(0);
    });

    // The two reels say different things; mixing them would describe a start-up
    // the pane is not doing.
    const strayed = screen.queryAllByText((text) => initial.includes(text) && !reporting.includes(text));

    expect(strayed).toEqual([]);

    release();
  });
});
