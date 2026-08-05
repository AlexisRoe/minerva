import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Adapters } from '@/adapters/create-adapters.util';
import { REPORT_ID_HEADER } from '@/domain/reporting/reporting.types';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { useReportStore } from '@/stores/report/report.store';
import type { ReportDraft } from '@/stores/report/report.types';
import { useSessionStore } from '@/stores/session/session.store';
import { createReportLoader } from './report.loader';

// The parameters are declared even though the bodies ignore them: without them
// `mock.calls` is typed as an empty tuple and nothing can be read back off it.
const { getMimeMessage, sendMail, submitReport } = vi.hoisted(() => ({
  getMimeMessage: vi.fn((_exchangeId: string) => Promise.resolve(new Blob(['raw'], { type: 'message/rfc822' }))),
  sendMail: vi.fn((_mail: { headers: Record<string, string> }) => Promise.resolve()),
  submitReport: vi.fn((_form: { userLanguage: string }) => Promise.resolve({ ...response })),
}));

// Hoisted mocks cannot close over an import, so the response is declared here.
const response = {
  reportId: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
  isIdentified: true,
  identifiedAs: 'system' as const,
};

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn((_error: unknown) => 'event-1') }));

vi.mock('@/platform/sentry/utils/capture-error.util', () => ({ captureError }));

/** Demo adapters with the three calls the flow makes replaced by spies. */
function adapters(): Adapters {
  const base = adaptersFixture();

  return {
    ...base,
    graph: { ...base.graph, getMimeMessage, sendMail },
    minerva: { ...base.minerva, submitReport },
  };
}

/** Puts a report in the store, the way the drawer does before navigating. */
function draft(overrides: Partial<ReportDraft> = {}): void {
  useReportStore.getState().setDraft({ variant: 'spam', reasons: [], comment: '', ...overrides });
}

/** Runs the flow the confirmation screen's `AsyncLoading` would run. */
function file(): ReturnType<ReturnType<typeof createReportLoader>> {
  return createReportLoader(adapters())();
}

const [firstReason] = demoSettings.userFeedback.reportingReasons;

describe('createReportLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitReport.mockResolvedValue({ ...response });
    getMimeMessage.mockResolvedValue(new Blob(['raw'], { type: 'message/rfc822' }));
    sendMail.mockResolvedValue(undefined);

    fillSession({ office: { environment: demoEnvironment, message: demoMessage, user: demoUser } });
  });

  afterEach(() => {
    useSessionStore.getState().reset();
    useReportStore.getState().reset();
  });

  it('downloads the MIME, uploads the report, then notifies', async () => {
    const order: string[] = [];

    getMimeMessage.mockImplementationOnce(() => {
      order.push('mime');

      return Promise.resolve(new Blob(['raw']));
    });
    submitReport.mockImplementationOnce(() => {
      order.push('upload');

      return Promise.resolve({ ...response });
    });
    sendMail.mockImplementation(() => {
      order.push('notify');

      return Promise.resolve();
    });

    draft();
    await file();

    // The upload is what produces the report id the mails are stamped with, so
    // it cannot run alongside them.
    expect(order.slice(0, 2)).toEqual(['mime', 'upload']);
    expect(order.filter((step) => step === 'notify')).toHaveLength(demoSettings.reportingMethods.length);
  });

  it('addresses the message by its REST id, never the Office.js one', async () => {
    draft();
    await file();

    expect(getMimeMessage).toHaveBeenCalledWith(demoMessage.exchangeId);
  });

  it('uploads what the user said, with the message it belongs to', async () => {
    draft({ variant: 'suspicious', reasons: [firstReason?.value ?? ''], comment: 'fake login page' });
    await file();

    expect(submitReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportingReasons: [firstReason?.value],
        feedbackMessage: 'fake login page',
        reportedAs: 'suspicious',
        deliveredAt: demoMessage.receivedAt,
        exchangeId: demoMessage.exchangeId,
        userLanguage: demoUser.displayLanguage,
      }),
    );
  });

  it('sends the full BCP-47 tag, not the reduced catalogue language', async () => {
    draft();
    await file();

    const uploaded = submitReport.mock.calls[0]?.[0] as { userLanguage: string };

    // The backend picks templates by region, so `en-GB` must not arrive as `en`.
    expect(uploaded.userLanguage).toBe('en-GB');
  });

  it('stamps every notification with the report id', async () => {
    draft();
    await file();

    for (const call of sendMail.mock.calls) {
      const mail = call[0] as { headers: Record<string, string> };

      expect(mail.headers[REPORT_ID_HEADER]).toBe(response.reportId);
    }
  });

  it('notifies every configured method', async () => {
    draft();

    const result = await file();

    expect(result?.outcomes).toEqual(
      demoSettings.reportingMethods.map((method) => ({ address: method.address, delivered: true })),
    );
  });

  it('clears the draft once the report is filed', async () => {
    draft();
    await file();

    // A remount with the draft still in place would file the same report twice.
    expect(useReportStore.getState().draft).toBeNull();
  });

  it('clears the draft even when a notification fails', async () => {
    sendMail.mockRejectedValue(new Error('relay refused'));

    draft();
    await file();

    // The report is already in; only the mails failed, and re-running must not
    // produce a second report.
    expect(useReportStore.getState().draft).toBeNull();
  });

  it('resolves with nothing when there is no report to file', async () => {
    // A reopened pane, or the confirmation screen reached without a report. It
    // says its neutral line rather than filing anything.
    await expect(file()).resolves.toBeUndefined();
    expect(getMimeMessage).not.toHaveBeenCalled();
    expect(submitReport).not.toHaveBeenCalled();
  });

  it('reports a partial failure without losing the report', async () => {
    sendMail.mockRejectedValueOnce(new Error('mailbox full'));

    draft();

    const result = await file();

    // The report is already filed by this point. Failing here would tell the user
    // it did not go through and invite a duplicate for every method that worked.
    expect(result?.outcomes.map((outcome) => outcome.delivered)).toEqual([false, true]);
    expect(result?.response).toEqual(response);
  });

  it('reports a failed notification even though it swallows it', async () => {
    const failure = new Error('mailbox full');
    sendMail.mockRejectedValueOnce(failure);

    draft();
    await file();

    // Swallowed for the user is not swallowed for us: undelivered would otherwise
    // be visible only on a screen the user closes.
    expect(captureError).toHaveBeenCalledTimes(1);

    const [reported] = vi.mocked(captureError).mock.calls[0] ?? [];

    expect(reported).toMatchObject({
      code: 'ERR_016',
      logLevel: 'warn',
      payload: {
        address: demoSettings.reportingMethods[0]?.address,
        reportId: response.reportId,
      },
    });
    expect(reported).toHaveProperty('cause.message', 'mailbox full');
  });

  it('reports one event per failed address, not one per submission', async () => {
    sendMail.mockRejectedValue(new Error('relay refused'));

    draft();
    await file();

    // A single misconfigured mailbox and a Graph outage are different problems,
    // and grouping them into one event would hide which of the two happened.
    expect(captureError).toHaveBeenCalledTimes(demoSettings.reportingMethods.length);
  });

  it('does not report anything when every notification lands', async () => {
    draft();
    await file();

    expect(captureError).not.toHaveBeenCalled();
  });

  it('survives every method failing', async () => {
    sendMail.mockRejectedValue(new Error('relay refused'));

    draft();

    const result = await file();

    expect(result?.outcomes.every((outcome) => !outcome.delivered)).toBe(true);
    expect(result?.response.reportId).toBe(response.reportId);
  });

  it('does fail when the upload itself fails', async () => {
    submitReport.mockRejectedValueOnce(new Error('backend down'));

    draft();

    // Nothing has been filed, so there is nothing to confirm -- this belongs on
    // the error screen rather than a confirmation saying it worked.
    await expect(file()).rejects.toThrow('backend down');
    expect(sendMail).not.toHaveBeenCalled();
    // The draft survives, because the report it describes was never filed.
    expect(useReportStore.getState().draft).not.toBeNull();
  });

  it('carries the variant through to the confirmation screen', async () => {
    draft({ variant: 'spam' });

    expect((await file())?.reportedAs).toBe('spam');
  });

  it('refuses to run before the pane has finished starting up', async () => {
    useSessionStore.getState().reset();
    draft();

    // A wiring fault rather than a state a user can reach: the drawer only
    // exists behind the start-up gate.
    await expect(file()).rejects.toThrow(expect.objectContaining({ code: 'ERR_019' }));
  });

  it('refuses to file a report for a pane that was opened on no message', async () => {
    fillSession({ office: { environment: demoEnvironment, message: null, user: demoUser } });
    draft();

    await expect(file()).rejects.toThrow(expect.objectContaining({ code: 'ERR_019' }));
  });
});
