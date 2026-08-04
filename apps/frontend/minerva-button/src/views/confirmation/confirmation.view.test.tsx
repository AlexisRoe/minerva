import type { EmailType } from '@minerva/typescript-lib';
import { MinervaThemeProvider } from '@minerva/ui-lib';
import { type RenderResult, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncLoading } from '@/components/async-loading/async-loading.component';
import type { ReportResult } from '@/domain/reporting/reporting.types';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { configFixture } from '@/fixtures/config.fixture';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { useOfficeStore } from '@/stores/office/office.store';
import { useSettingsStore } from '@/stores/settings/settings.store';
import type { ReportVariant } from '@/stores/settings/settings.types';
import { ConfirmationView } from './confirmation.view';

const { moveMessage, closePane, captureError } = vi.hoisted(() => ({
  moveMessage: vi.fn((_id: string, _folder: string) => Promise.resolve()),
  closePane: vi.fn(),
  captureError: vi.fn(),
}));

vi.mock('@/platform/sentry/utils/capture-error.util', () => ({ captureError }));

/** Demo adapters with the two calls this screen makes replaced by spies. */
function adapters(): ReturnType<typeof adaptersFixture> {
  const base = adaptersFixture();

  return {
    ...base,
    graph: { ...base.graph, moveMessage },
    office: { ...base.office, closePane },
  };
}

/** A completed report, with both methods delivered unless a case says otherwise. */
function result(overrides: Partial<ReportResult> = {}): ReportResult {
  return {
    response: {
      reportId: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
      isIdentified: false,
      identifiedAs: 'unknown',
    },
    reportedAs: 'suspicious',
    outcomes: demoSettings.reportingMethods.map((method) => ({
      address: method.address,
      delivered: true,
    })),
    ...overrides,
  };
}

/**
 * Mounts the view behind a loader that resolves with `data`.
 *
 * The screen reads `useAsyncData()`, so it has to sit inside an
 * {@link AsyncLoading} -- which is exactly how `App` mounts it, with the
 * reporting loader in place of this stub.
 */
function renderView(data: ReportResult | undefined): RenderResult {
  const loader = (): Promise<ReportResult | undefined> => Promise.resolve(data);

  return render(
    <ConfigProvider adapters={adapters()} config={configFixture}>
      <MinervaThemeProvider>
        <AsyncLoading loader={loader} type="report">
          <ConfirmationView />
        </AsyncLoading>
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

/** Waits for the reporting reel to give way to the screen itself. */
async function file(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
}

describe('ConfirmationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOfficeStore.getState().setOffice({ environment: demoEnvironment, message: demoMessage, user: demoUser });
    useSettingsStore.getState().setSettings(demoSettings);
  });

  afterEach(() => {
    useOfficeStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('says what was filed, keyed on the variant', async () => {
    renderView(result({ reportedAs: 'spam' }));
    await file();

    expect(await screen.findByText(/reported as spam/i)).toBeInTheDocument();
  });

  it('names every method that was told', async () => {
    renderView(result());
    await file();

    for (const method of demoSettings.reportingMethods) {
      expect(await screen.findByText(new RegExp(method.address, 'i'))).toBeInTheDocument();
    }
  });

  it('says which method could not be reached, without calling the report failed', async () => {
    const outcomes = demoSettings.reportingMethods.map((method, index) => ({
      address: method.address,
      delivered: index !== 0,
    }));

    renderView(result({ outcomes }));
    await file();

    // The report is filed either way; the user must not be told to try again.
    expect(await screen.findByText(/could not reach/i)).toBeInTheDocument();
    expect(await screen.findByText(/thanks for reporting/i)).toBeInTheDocument();
  });

  it('quotes the report id, so a support call has something to give', async () => {
    renderView(result());
    await file();

    expect(await screen.findByText(/a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836/)).toBeInTheDocument();
  });

  it.each<[EmailType, RegExp]>([
    ['simulation', /phishing test/i],
    ['system', /already knows/i],
  ])('says what the backend recognised a %s as', async (identifiedAs, expected) => {
    renderView(result({ response: { reportId: 'r', isIdentified: true, identifiedAs } }));
    await file();

    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it('says only the neutral line about an email nobody recognised', async () => {
    renderView(result());
    await file();

    expect(await screen.findByText(/has not seen this mail before/i)).toBeInTheDocument();
    expect(screen.queryByText(/phishing test/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already knows/i)).not.toBeInTheDocument();
  });

  it.each<EmailType>(['simulation', 'system'])(
    'refuses to claim a %s when the backend did not identify the mail',
    async (identifiedAs) => {
      renderView(result({ response: { reportId: 'r', isIdentified: false, identifiedAs } }));
      await file();

      // Telling someone a real phishing mail was "only a test" is the one mistake
      // this screen must never make, so both halves have to agree.
      expect(await screen.findByText(/has not seen this mail before/i)).toBeInTheDocument();
      expect(screen.queryByText(/phishing test/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/already knows/i)).not.toBeInTheDocument();
    },
  );

  it('shows the contact block only where the tenant filled it in', async () => {
    renderView(result());
    await file();

    expect(await screen.findByText(demoSettings.contact.contactPerson ?? '')).toBeInTheDocument();
  });

  it('hides the contact block where it is switched off', async () => {
    useSettingsStore.getState().setSettings({ ...demoSettings, contact: { ...demoSettings.contact, enable: false } });

    renderView(result());
    await file();

    await screen.findByText(/thanks for reporting/i);
    expect(screen.queryByText(demoSettings.contact.contactPerson ?? '')).not.toBeInTheDocument();
  });

  it.each<[ReportVariant, RegExp, string]>([
    ['suspicious', /delete the mail/i, 'deleteditems'],
    ['spam', /move to junk/i, 'junkemail'],
  ])('moves a %s report to the right folder, then closes', async (reportedAs, label, folder) => {
    renderView(result({ reportedAs }));
    await file();

    await userEvent.click(await screen.findByRole('button', { name: label }));

    await waitFor(() => {
      expect(moveMessage).toHaveBeenCalledWith(demoMessage.exchangeId, folder);
    });
    expect(closePane).toHaveBeenCalled();
  });

  it('keeps the pane open and says so when the move fails', async () => {
    moveMessage.mockRejectedValueOnce(new Error('item not found'));

    renderView(result());
    await file();
    await userEvent.click(await screen.findByRole('button', { name: /delete the mail/i }));

    // Closing here would let the user believe the mail had gone.
    expect(await screen.findByText(/could not be moved/i)).toBeInTheDocument();
    expect(closePane).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalled();
  });

  it('offers a way out that leaves the mail alone', async () => {
    renderView(result({ reportedAs: 'spam' }));
    await file();

    await userEvent.click(await screen.findByRole('button', { name: /close/i }));

    expect(closePane).toHaveBeenCalled();
    expect(moveMessage).not.toHaveBeenCalled();
  });

  it('falls back to the neutral screen when reached without a report', async () => {
    renderView(undefined);
    await file();

    // A reload, or the pane reopened. There is nothing to confirm, so it must not
    // claim a report was filed.
    expect(await screen.findByText(/sent to minerva/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete the mail/i })).not.toBeInTheDocument();
  });
});
