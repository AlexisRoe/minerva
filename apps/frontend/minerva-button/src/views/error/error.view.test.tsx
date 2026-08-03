import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ROUTES } from '../../routing';
import { ErrorView } from './error.view';

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn() }));

vi.mock('../../sentry', () => ({ captureError }));

/** Mounts the view on its own route, with the screen its button leads back to. */
function renderView() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.taskPane, element: <p>task pane</p> },
      { path: ROUTES.error, Component: ErrorView },
    ],
    { initialEntries: [ROUTES.error] },
  );

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

describe('ErrorView', () => {
  it('explains that the pane could not continue', async () => {
    renderView();

    expect(await screen.findByRole('heading', { name: 'Minerva could not continue.' })).toBeInTheDocument();
    expect(captureError).not.toHaveBeenCalled();
  });

  it('goes back to the task pane', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByText('task pane')).toBeInTheDocument();
    });
  });
});
