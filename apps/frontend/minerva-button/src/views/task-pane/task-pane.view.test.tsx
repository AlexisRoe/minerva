import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { OutlookMessage } from '../../adapters/office';
import { ROUTES } from '../../routing';
import { TaskPaneView } from './task-pane.view';

const message: OutlookMessage = {
  id: 'AAMkAD==',
  exchangeId: 'rest:AAMkAD==',
  internetMessageId: '<abc@example.com>',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  receivedAt: '2026-08-03T09:15:00.000Z',
};

vi.mock('../../adapters/office', () => ({
  useCurrentMessage: () => ({ message, isLoading: false }),
}));

/** Mounts the view with the two screens it can navigate to. */
function renderView() {
  const router = createMemoryRouter([
    { path: ROUTES.taskPane, Component: TaskPaneView },
    { path: ROUTES.confirmation, element: <p>confirmation</p> },
    { path: ROUTES.error, element: <p>error screen</p> },
  ]);

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

describe('TaskPaneView', () => {
  it('shows the open message', async () => {
    renderView();

    expect(await screen.findByText('Invoice 2026-0042')).toBeInTheDocument();
  });

  it('goes on to the confirmation', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /send to minerva/i }));

    await waitFor(() => {
      expect(screen.getByText('confirmation')).toBeInTheDocument();
    });
  });
});
