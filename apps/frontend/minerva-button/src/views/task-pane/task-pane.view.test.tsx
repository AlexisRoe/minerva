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

const { submit } = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock('../../adapters/office', () => ({
  useCurrentMessage: () => ({ message, isLoading: false }),
}));

vi.mock('../../adapters/minerva', () => ({
  useSubmitWorkItem: () => ({ submit, isSubmitting: false, receipt: null }),
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

  it('goes to the confirmation once the message is accepted', async () => {
    submit.mockResolvedValueOnce({ workItemId: 'wi_1', acceptedAt: '2026-08-03T09:20:00.000Z' });
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /send to minerva/i }));

    await waitFor(() => {
      expect(screen.getByText('confirmation')).toBeInTheDocument();
    });
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ messageId: 'AAMkAD==' }));
  });

  it('goes to the error screen when it is not', async () => {
    submit.mockResolvedValueOnce(null);
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /send to minerva/i }));

    await waitFor(() => {
      expect(screen.getByText('error screen')).toBeInTheDocument();
    });
  });
});
