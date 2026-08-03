import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ROUTES } from '../../routing';
import { ConfirmationView } from './confirmation.view';

/** Mounts the view on its own route, with the screen its button leads back to. */
function renderView() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.taskPane, element: <p>task pane</p> },
      { path: ROUTES.confirmation, Component: ConfirmationView },
    ],
    { initialEntries: [ROUTES.confirmation] },
  );

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

describe('ConfirmationView', () => {
  it('confirms the message was accepted', async () => {
    renderView();

    expect(await screen.findByRole('heading', { name: 'Sent to Minerva' })).toBeInTheDocument();
  });

  it('goes back to the task pane', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByText('task pane')).toBeInTheDocument();
    });
  });
});
