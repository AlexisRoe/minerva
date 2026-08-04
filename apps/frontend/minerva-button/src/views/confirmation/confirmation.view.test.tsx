import type { EmailType } from '@minerva/typescript-lib';
import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Form, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider, configFixture } from '../../config';
import { demoEnvironment, demoMessage, demoSettings, demoUser } from '../../demo';
import type { ReportResult } from '../../reporting';
import { type ReportVariant, useOfficeStore, useSettingsStore } from '../../store';
import { ConfirmationView } from './confirmation.view';

const { moveMessage, closePane, captureError } = vi.hoisted(() => ({
  moveMessage: vi.fn((_id: string, _folder: string) => Promise.resolve()),
  closePane: vi.fn(),
  captureError: vi.fn(),
}));

vi.mock('../../routing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../routing')>()),
  createPaneAdapters: () => ({ graph: { moveMessage }, minerva: {} }),
}));

vi.mock('../../adapters/office', () => ({ closePane }));
vi.mock('../../sentry', () => ({ captureError }));

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
 * Mounts the view with an action that answers with `data`.
 *
 * The screen reads `useActionData()`, so it has to be reached by submitting to
 * its own route -- which is exactly how the report drawer reaches it.
 */
function renderView(data: ReportResult | undefined) {
  const router = createMemoryRouter([
    {
      path: '/confirmation',
      Component: ConfirmationView,
      action: () => data ?? null,
    },
    {
      path: '/',
      element: (
        <Form action="/confirmation" method="post">
          <button type="submit">file</button>
        </Form>
      ),
    },
  ]);

  return render(
    <ConfigProvider config={configFixture}>
      <MinervaThemeProvider>
        <RouterProvider router={router} />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

/** Submits the form, which runs the action and lands on the confirmation. */
async function file(): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'file' }));
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
