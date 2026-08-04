import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { UnsupportedView } from './unsupported.view';

/** Mounts the view at `/unsupported` with the given query string. */
function renderView(search: string) {
  const router = createMemoryRouter([{ path: '/unsupported', Component: UnsupportedView }], {
    initialEntries: [`/unsupported${search}`],
  });

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

describe('UnsupportedView', () => {
  it('is drawn in the pane frame, mark and all', async () => {
    renderView('?reason=ERR_008');

    // An unusable host is still Minerva speaking. A bare panel with no mark
    // reads as a broken page rather than as a considered answer.
    expect(await screen.findByText('Minerva')).toBeInTheDocument();
  });

  it('explains a blocked Office.js specifically', async () => {
    renderView('?reason=ERR_007');

    expect(await screen.findByText(/could not reach Outlook/i)).toBeInTheDocument();
  });

  it('explains the wrong host specifically', async () => {
    renderView('?reason=ERR_008');

    expect(await screen.findByText(/only runs in Outlook/i)).toBeInTheDocument();
  });

  it('explains an Outlook that is too old specifically', async () => {
    renderView('?reason=ERR_009');

    expect(await screen.findByText(/too old for Minerva/i)).toBeInTheDocument();
  });

  it('falls back to the generic line for an unknown reason', async () => {
    renderView('?reason=ERR_999');

    // Adding an error code must not be able to leave a blank screen.
    expect(await screen.findByText(/could not start in this window/i)).toBeInTheDocument();
  });

  it('falls back when there is no reason at all', async () => {
    renderView('');

    expect(await screen.findByText(/could not start in this window/i)).toBeInTheDocument();
  });

  it('offers no way out, because there is nothing to retry', async () => {
    renderView('?reason=ERR_008');

    await screen.findByText(/only runs in Outlook/i);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
