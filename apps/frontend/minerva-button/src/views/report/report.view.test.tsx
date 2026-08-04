import type { MinervaButtonSettings } from '@minerva/typescript-lib';
import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { demoEnvironment, demoMessage, demoSettings, demoUser } from '../../demo';
import { ROUTES } from '../../routing';
import { useOfficeStore, useSettingsStore } from '../../store';
import { ReportView } from './report.view';

/** Records what the drawer submitted, so a test can assert on the report. */
const submitted: FormData[] = [];

/**
 * Mounts the view with the confirmation route as its action target.
 *
 * The action stands in for the reporting flow: what matters here is *what* the
 * drawer submits, not what is done with it.
 */
function renderView(settings: MinervaButtonSettings | null = demoSettings, message = demoMessage) {
  useOfficeStore.getState().setOffice({
    environment: demoEnvironment,
    message,
    user: demoUser,
  });

  if (settings !== null) {
    useSettingsStore.getState().setSettings(settings);
  }

  const router = createMemoryRouter([
    { path: ROUTES.taskPane, Component: ReportView },
    {
      path: ROUTES.confirmation,
      element: <p>confirmation</p>,
      action: async ({ request }: { request: Request }) => {
        submitted.push(await request.formData());

        return null;
      },
    },
  ]);

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

/** Opens the suspicious drawer and ticks the first reason. */
async function openSuspiciousDrawer() {
  await userEvent.click(await screen.findByRole('button', { name: /suspicious/i }));

  const [firstReason] = demoSettings.userFeedback.reportingReasons;

  await userEvent.click(await screen.findByRole('checkbox', { name: firstReason?.label }));
}

describe('ReportView', () => {
  afterEach(() => {
    submitted.length = 0;
    useOfficeStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('offers both reports where the tenant allows both', async () => {
    renderView();

    expect(await screen.findByRole('button', { name: /suspicious/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spam/i })).toBeInTheDocument();
  });

  it('hides the spam button where the tenant switched it off', async () => {
    renderView({
      ...demoSettings,
      features: { ...demoSettings.features, enableSpamReporting: false },
    });

    expect(await screen.findByRole('button', { name: /suspicious/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /spam/i })).not.toBeInTheDocument();
  });

  it('says so when the pane is not open on a message', async () => {
    renderView(demoSettings, null as unknown as typeof demoMessage);

    expect(await screen.findByText(/open a message in outlook/i)).toBeInTheDocument();
  });

  it('keeps the pane frame when there is no message to report', async () => {
    renderView(demoSettings, null as unknown as typeof demoMessage);

    // The pane with nothing to work on is still the pane; only its content is
    // missing, so the mark stays where it was.
    expect(await screen.findByText('Minerva')).toBeInTheDocument();
  });

  it('does not file anything on the first click', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /suspicious/i }));

    // The button opens the drawer that asks what is wrong. Filing here would make
    // a mandatory reason unenforceable.
    expect(submitted).toEqual([]);
    expect(await screen.findByText(/report as suspicious/i)).toBeInTheDocument();
  });

  it('holds the send button until a mandatory reason is picked', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /suspicious/i }));

    const send = await screen.findByRole('button', { name: /send the report/i });

    expect(send).toBeDisabled();

    const [firstReason] = demoSettings.userFeedback.reportingReasons;
    await userEvent.click(await screen.findByRole('checkbox', { name: firstReason?.label }));

    await waitFor(() => {
      expect(send).toBeEnabled();
    });
  });

  it('submits the variant, the reasons and the note', async () => {
    renderView();
    await openSuspiciousDrawer();

    await userEvent.type(await screen.findByRole('textbox'), 'It asked me for my password.');
    await userEvent.click(await screen.findByRole('button', { name: /send the report/i }));

    await waitFor(() => {
      expect(submitted).toHaveLength(1);
    });

    const form = submitted[0] as FormData;
    const [firstReason] = demoSettings.userFeedback.reportingReasons;

    expect(form.get('variant')).toBe('suspicious');
    expect(form.getAll('reasons')).toEqual([firstReason?.value]);
    expect(form.get('comment')).toBe('It asked me for my password.');
  });

  it('shows the details drawer only where the tenant enabled it', async () => {
    const { unmount } = renderView();

    expect(await screen.findByRole('button', { name: /show details/i })).toBeInTheDocument();

    unmount();
    useSettingsStore.getState().reset();

    renderView({
      ...demoSettings,
      features: { ...demoSettings.features, enableEmailDetails: false },
    });

    await screen.findByRole('button', { name: /suspicious/i });
    expect(screen.queryByRole('button', { name: /show details/i })).not.toBeInTheDocument();
  });

  it('builds the details from what the host reported', async () => {
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /show details/i }));

    expect(await screen.findByText(demoUser.email)).toBeInTheDocument();
    expect(screen.getByText(demoMessage.subject)).toBeInTheDocument();
    expect(screen.getByText(demoEnvironment.platform)).toBeInTheDocument();
  });

  it('opens the next report blank after one is abandoned', async () => {
    renderView();
    await openSuspiciousDrawer();

    // Cancel rather than send: sending navigates to the confirmation screen, so
    // the only way back to a second drawer on this screen is abandoning the first.
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^spam/i }));

    // Carrying the previous pick over would file a report the user never made.
    expect(await screen.findByRole('button', { name: /send the report/i })).toBeDisabled();
    expect(submitted).toEqual([]);
  });

  it('leaves the report screen once a report is filed', async () => {
    renderView();
    await openSuspiciousDrawer();
    await userEvent.click(await screen.findByRole('button', { name: /send the report/i }));

    await waitFor(() => {
      expect(submitted).toHaveLength(1);
    });

    expect(await screen.findByText('confirmation')).toBeInTheDocument();
  });
});
