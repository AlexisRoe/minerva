import type { MinervaButtonSettings } from '@minerva/typescript-lib';
import { MinervaThemeProvider } from '@minerva/ui-lib';
import { type RenderResult, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { ROUTES } from '@/constants/routes.constants';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { resetStores } from '@/fixtures/stores.fixture';
import { useReportStore } from '@/stores/report/report.store';
import { useSessionStore } from '@/stores/session/session.store';
import { ReportView } from './report.view';

/**
 * Mounts the view with a stand-in for the confirmation screen.
 *
 * The report the drawer collects lands in {@link useReportStore}, so what is
 * asserted here is *what* the drawer records and that it leaves for the next
 * screen -- filing it is the reporting loader's job and has its own tests.
 */
function renderView(settings: MinervaButtonSettings = demoSettings, message = demoMessage): RenderResult {
  fillSession({
    office: { environment: demoEnvironment, message, user: demoUser },
    settings,
  });

  return render(
    <MinervaThemeProvider>
      <MemoryRouter initialEntries={[ROUTES.taskPane]}>
        <Routes>
          <Route element={<ReportView />} path={ROUTES.taskPane} />
          <Route element={<p>confirmation</p>} path={ROUTES.confirmation} />
        </Routes>
      </MemoryRouter>
    </MinervaThemeProvider>,
  );
}

/** Opens the suspicious drawer and ticks the first reason. */
async function openSuspiciousDrawer(): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: /suspicious/i }));

  const [firstReason] = demoSettings.userFeedback.reportingReasons;

  await userEvent.click(await screen.findByRole('checkbox', { name: firstReason?.label }));
}

describe('ReportView', () => {
  afterEach(resetStores);

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
    expect(useReportStore.getState().draft).toBeNull();
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

  it('records the variant, the reasons and the note', async () => {
    renderView();
    await openSuspiciousDrawer();

    await userEvent.type(await screen.findByRole('textbox'), 'It asked me for my password.');
    await userEvent.click(await screen.findByRole('button', { name: /send the report/i }));

    const [firstReason] = demoSettings.userFeedback.reportingReasons;

    await waitFor(() => {
      expect(useReportStore.getState().draft).toEqual({
        variant: 'suspicious',
        reasons: [firstReason?.value],
        comment: 'It asked me for my password.',
      });
    });
  });

  it('shows the details drawer only where the tenant enabled it', async () => {
    const { unmount } = renderView();

    expect(await screen.findByRole('button', { name: /show details/i })).toBeInTheDocument();

    unmount();
    useSessionStore.getState().reset();

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
    expect(useReportStore.getState().draft).toBeNull();
  });

  it('leaves the report screen once a report is filed', async () => {
    renderView();
    await openSuspiciousDrawer();
    await userEvent.click(await screen.findByRole('button', { name: /send the report/i }));

    expect(await screen.findByText('confirmation')).toBeInTheDocument();
    expect(useReportStore.getState().draft).not.toBeNull();
  });
});
