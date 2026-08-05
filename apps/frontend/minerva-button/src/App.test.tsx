import { MinervaThemeProvider } from '@minerva/ui-lib';
import { type RenderResult, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { configFixture } from '@/fixtures/config.fixture';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { useReportStore } from '@/stores/report/report.store';
import { useSessionStore } from '@/stores/session/session.store';
import { App } from './App';

/**
 * Long enough for the demo adapters' deliberate latency.
 *
 * The demo set sleeps {@link DEMO_LATENCY_MS} per call so the loading reels are
 * legible in a walkthrough; the start-up sequence makes three such calls, and
 * the reporting one four.
 */
const FLOW_TIMEOUT_MS = 10_000;

/** The report screen, once the start-up sequence behind it has finished. */
function findReportButton(): Promise<HTMLElement> {
  return screen.findByRole('button', { name: /suspicious/i }, { timeout: FLOW_TIMEOUT_MS });
}

/**
 * Mirrors the bootstrap in `main.tsx`, against the demo adapters.
 *
 * Nothing is mocked: the demo set answers from fixtures without touching the
 * network or `Office`, so the real start-up loader really runs and the test
 * exercises the wiring end to end -- providers, router, both loaders, both
 * screens.
 */
function renderApp(): RenderResult {
  return render(
    <ConfigProvider adapters={adaptersFixture()} config={configFixture}>
      <MinervaThemeProvider>
        <App />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

describe('App', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
    useReportStore.getState().reset();
  });

  it('runs the start-up sequence behind the reel, then shows the report page', async () => {
    renderApp();

    // The reel is on screen for as long as the loader runs -- there is no
    // half-rendered report page in between.
    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await findReportButton()).toBeInTheDocument();
  });

  it('fills the session store from what the start-up sequence read', async () => {
    renderApp();

    await findReportButton();

    const { office, auth, settings } = useSessionStore.getState();

    // One store, one write: the report page is on screen, so all three slices
    // are there.
    expect(office?.user.name).toBe('Ada Lovelace');
    expect(auth?.authorization.isAuthorized).toBe(true);
    expect(settings).not.toBeNull();
  });

  it('walks a report through the drawer to the confirmation screen', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await findReportButton());

    // The tenant fixture makes a reason compulsory, so sending is impossible
    // until one is ticked.
    await user.click(await screen.findByRole('checkbox', { name: /Sender address looks wrong/i }));
    await user.click(screen.getByRole('button', { name: /send/i }));

    // The report id only exists because the reporting loader ran and the
    // backend answered -- proof the flow reached the far side.
    expect(await screen.findByText(/[0-9a-f-]{8}/i, undefined, { timeout: FLOW_TIMEOUT_MS })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('clears the draft once the report is filed, so it cannot be filed twice', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await findReportButton());
    await user.click(await screen.findByRole('checkbox', { name: /Sender address looks wrong/i }));
    await user.click(screen.getByRole('button', { name: /send/i }));

    await screen.findByRole('button', { name: /close/i }, { timeout: FLOW_TIMEOUT_MS });

    expect(useReportStore.getState().draft).toBeNull();
  });
});
