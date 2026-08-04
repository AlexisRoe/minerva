import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REPORT_ID_HEADER } from '@/domain/reporting/reporting.types';
import { configFixture } from '@/fixtures/config.fixture';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { useOfficeStore } from '@/stores/office/office.store';
import { useSettingsStore } from '@/stores/settings/settings.store';
import { createReportAction, readReportIntent } from './report.action';

// The parameters are declared even though the bodies ignore them: without them
// `mock.calls` is typed as an empty tuple and nothing can be read back off it.
const { getMimeMessage, sendMail, submitReport } = vi.hoisted(() => ({
  getMimeMessage: vi.fn((_exchangeId: string) => Promise.resolve(new Blob(['raw'], { type: 'message/rfc822' }))),
  sendMail: vi.fn((_mail: { headers: Record<string, string> }) => Promise.resolve()),
  submitReport: vi.fn((_form: { userLanguage: string }) => Promise.resolve({ ...demoReportingResponseStub })),
}));

// Hoisted mocks cannot close over an import, so the response is duplicated here.
const demoReportingResponseStub = {
  reportId: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
  isIdentified: true,
  identifiedAs: 'system' as const,
};

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn((_error: unknown) => 'event-1') }));

vi.mock('@/platform/sentry/utils/capture-error.util', () => ({ captureError }));

vi.mock('../loaders/report.loader', () => ({
  createPaneAdapters: () => ({
    graph: { getMimeMessage, sendMail, moveMessage: vi.fn() },
    minerva: { submitReport, authorize: vi.fn(), getSettings: vi.fn() },
  }),
}));

/** Builds the body the report drawer submits. */
function form(entries: [string, string][]): FormData {
  const data = new FormData();

  for (const [key, value] of entries) {
    data.append(key, value);
  }

  return data;
}

/** Wraps form entries in the request React Router hands an action. */
function request(entries: [string, string][]): Request {
  return new Request('https://localhost/confirmation', { method: 'POST', body: form(entries) });
}

const [firstReason] = demoSettings.userFeedback.reportingReasons;

describe('readReportIntent', () => {
  it('reads back everything the drawer collected', () => {
    expect(
      readReportIntent(
        form([
          ['variant', 'spam'],
          ['reasons', 'reason-a'],
          ['reasons', 'reason-b'],
          ['comment', 'Looks like a fake login page.'],
        ]),
      ),
    ).toEqual({
      variant: 'spam',
      reasons: ['reason-a', 'reason-b'],
      comment: 'Looks like a fake login page.',
    });
  });

  it('reads repeated fields as the list they are', () => {
    const intent = readReportIntent(
      form([
        ['variant', 'suspicious'],
        ['reasons', 'only-one'],
      ]),
    );

    // A single pick must still come back as a list, or the upload would send a
    // string where the contract wants an array.
    expect(intent.reasons).toEqual(['only-one']);
  });

  it('tolerates a report with no reasons and no note', () => {
    expect(readReportIntent(form([['variant', 'spam']]))).toEqual({
      variant: 'spam',
      reasons: [],
      comment: '',
    });
  });

  it('falls back to suspicious rather than losing a malformed report', () => {
    // Whatever the form said, a submission got this far because a user pressed
    // send; dropping it would be worse than filing it under the stricter variant.
    expect(readReportIntent(form([['variant', 'nonsense']])).variant).toBe('suspicious');
    expect(readReportIntent(form([])).variant).toBe('suspicious');
  });
});

describe('createReportAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitReport.mockResolvedValue({ ...demoReportingResponseStub });
    getMimeMessage.mockResolvedValue(new Blob(['raw'], { type: 'message/rfc822' }));
    sendMail.mockResolvedValue(undefined);

    useOfficeStore.getState().setOffice({ environment: demoEnvironment, message: demoMessage, user: demoUser });
    useSettingsStore.getState().setSettings(demoSettings);
  });

  afterEach(() => {
    useOfficeStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('downloads the MIME, uploads the report, then notifies', async () => {
    const order: string[] = [];

    getMimeMessage.mockImplementationOnce(() => {
      order.push('mime');

      return Promise.resolve(new Blob(['raw']));
    });
    submitReport.mockImplementationOnce(() => {
      order.push('upload');

      return Promise.resolve({ ...demoReportingResponseStub });
    });
    sendMail.mockImplementation(() => {
      order.push('notify');

      return Promise.resolve();
    });

    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    // The upload is what produces the report id the mails are stamped with, so
    // it cannot run alongside them.
    expect(order.slice(0, 2)).toEqual(['mime', 'upload']);
    expect(order.filter((step) => step === 'notify')).toHaveLength(demoSettings.reportingMethods.length);
  });

  it('addresses the message by its REST id, never the Office.js one', async () => {
    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    expect(getMimeMessage).toHaveBeenCalledWith(demoMessage.exchangeId);
  });

  it('uploads what the user said, with the message it belongs to', async () => {
    await createReportAction(configFixture)({
      request: request([
        ['variant', 'suspicious'],
        ['reasons', firstReason?.value ?? ''],
        ['comment', 'fake login page'],
      ]),
    });

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
    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    const uploaded = submitReport.mock.calls[0]?.[0] as { userLanguage: string };

    // The backend picks templates by region, so `en-GB` must not arrive as `en`.
    expect(uploaded.userLanguage).toBe('en-GB');
  });

  it('stamps every notification with the report id', async () => {
    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    for (const call of sendMail.mock.calls) {
      const mail = call[0] as { headers: Record<string, string> };

      expect(mail.headers[REPORT_ID_HEADER]).toBe(demoReportingResponseStub.reportId);
    }
  });

  it('notifies every configured method', async () => {
    const result = await createReportAction(configFixture)({
      request: request([['variant', 'spam']]),
    });

    expect(result.outcomes).toEqual(
      demoSettings.reportingMethods.map((method) => ({
        address: method.address,
        delivered: true,
      })),
    );
  });

  it('reports a partial failure without losing the report', async () => {
    sendMail.mockRejectedValueOnce(new Error('mailbox full'));

    const result = await createReportAction(configFixture)({
      request: request([['variant', 'spam']]),
    });

    // The report is already filed by this point. Failing here would tell the user
    // it did not go through and invite a duplicate for every method that worked.
    expect(result.outcomes.map((outcome) => outcome.delivered)).toEqual([false, true]);
    expect(result.response).toEqual(demoReportingResponseStub);
  });

  it('reports a failed notification even though it swallows it', async () => {
    const failure = new Error('mailbox full');
    sendMail.mockRejectedValueOnce(failure);

    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    // Swallowed for the user is not swallowed for us: undelivered would otherwise
    // be visible only on a screen the user closes.
    expect(captureError).toHaveBeenCalledTimes(1);

    const [reported] = vi.mocked(captureError).mock.calls[0] ?? [];

    expect(reported).toMatchObject({
      code: 'ERR_016',
      logLevel: 'warn',
      payload: {
        address: demoSettings.reportingMethods[0]?.address,
        reportId: demoReportingResponseStub.reportId,
      },
    });
    expect(reported).toHaveProperty('cause.message', 'mailbox full');
  });

  it('reports one event per failed address, not one per submission', async () => {
    sendMail.mockRejectedValue(new Error('relay refused'));

    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    // A single misconfigured mailbox and a Graph outage are different problems,
    // and grouping them into one event would hide which of the two happened.
    expect(captureError).toHaveBeenCalledTimes(demoSettings.reportingMethods.length);
  });

  it('does not report anything when every notification lands', async () => {
    await createReportAction(configFixture)({ request: request([['variant', 'spam']]) });

    expect(captureError).not.toHaveBeenCalled();
  });

  it('survives every method failing', async () => {
    sendMail.mockRejectedValue(new Error('relay refused'));

    const result = await createReportAction(configFixture)({
      request: request([['variant', 'spam']]),
    });

    expect(result.outcomes.every((outcome) => !outcome.delivered)).toBe(true);
    expect(result.response.reportId).toBe(demoReportingResponseStub.reportId);
  });

  it('does fail when the upload itself fails', async () => {
    submitReport.mockRejectedValueOnce(new Error('backend down'));

    // Nothing has been filed, so there is nothing to confirm -- this belongs on
    // the error screen rather than a confirmation saying it worked.
    await expect(createReportAction(configFixture)({ request: request([['variant', 'spam']]) })).rejects.toThrow(
      'backend down',
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('carries the variant through to the confirmation screen', async () => {
    const result = await createReportAction(configFixture)({
      request: request([['variant', 'spam']]),
    });

    expect(result.reportedAs).toBe('spam');
  });

  it('refuses to run before the pane has finished starting up', async () => {
    useSettingsStore.getState().reset();

    await expect(createReportAction(configFixture)({ request: request([['variant', 'spam']]) })).rejects.toThrow(
      /finished starting up/,
    );
  });
});
