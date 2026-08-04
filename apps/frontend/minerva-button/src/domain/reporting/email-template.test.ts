import type { ReportingMethod } from '@minerva/typescript-lib';
import { describe, expect, it } from 'vitest';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { buildNotificationMail, type NotificationInput } from './email-template';
import { ATTACHMENT_NAME, REPORT_ID_HEADER, REPORTED_BY, REPORTED_BY_HEADER } from './reporting.types';

const [attaching, plain] = demoSettings.reportingMethods as [ReportingMethod, ReportingMethod];

/** The input every case starts from; each overrides the one thing it is about. */
function input(overrides: Partial<NotificationInput> = {}): NotificationInput {
  return {
    method: attaching,
    message: demoMessage,
    user: demoUser,
    reportedAs: 'suspicious',
    reasons: demoSettings.userFeedback.reportingReasons.slice(0, 1),
    comment: 'It asked me for my password.',
    reportId: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
    mime: new Blob(['raw'], { type: 'message/rfc822' }),
    ...overrides,
  };
}

describe('buildNotificationMail', () => {
  it('addresses the method it was built for', () => {
    expect(buildNotificationMail(input()).to).toBe(attaching.address);
  });

  it('applies the tenant prefix verbatim', () => {
    // Their mail rules match on the prefix, so a separator added here would stop
    // those rules firing without anything visibly breaking.
    expect(buildNotificationMail(input()).subject).toBe(`${attaching.subjectPrefix}${demoMessage.subject}`);
  });

  it('marks provenance with the two X- headers', () => {
    const { headers } = buildNotificationMail(input());

    expect(headers).toEqual({
      [REPORTED_BY_HEADER]: REPORTED_BY,
      [REPORT_ID_HEADER]: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
    });
  });

  it('keeps within the header names and count Graph accepts', () => {
    const { headers } = buildNotificationMail(input());
    const names = Object.keys(headers);

    // Graph rejects a non-X- name outright, and refuses more than five.
    expect(names.every((name) => name.startsWith('X-'))).toBe(true);
    expect(names.length).toBeLessThanOrEqual(5);
  });

  it('attaches the original only where the method asks for it', () => {
    const mime = new Blob(['raw'], { type: 'message/rfc822' });

    expect(buildNotificationMail(input({ method: attaching, mime })).attachment).toEqual({
      name: ATTACHMENT_NAME,
      contentType: 'message/rfc822',
      content: mime,
    });
    expect(buildNotificationMail(input({ method: plain })).attachment).toBeUndefined();
  });

  it('says who reported it, as what, and why', () => {
    const { bodyHtml } = buildNotificationMail(input());
    const [firstReason] = demoSettings.userFeedback.reportingReasons;

    expect(bodyHtml).toContain(demoUser.email);
    expect(bodyHtml).toContain('suspicious');
    expect(bodyHtml).toContain(firstReason?.defaultLabel);
    expect(bodyHtml).toContain('It asked me for my password.');
  });

  it('names the reasons in English rather than by id', () => {
    const { bodyHtml } = buildNotificationMail(input());
    const [firstReason] = demoSettings.userFeedback.reportingReasons;

    // A shared queue, possibly an MSSP in another country, has never seen this
    // tenant's configuration -- an id would be unreadable there.
    expect(bodyHtml).not.toContain(firstReason?.value);
  });

  it('records the reporter language instead of translating the mail', () => {
    const { bodyHtml } = buildNotificationMail(input());

    expect(bodyHtml).toContain(demoUser.displayLanguage);
    expect(bodyHtml).toContain('Reported by');
  });

  it('leaves out the sections a report did not fill in', () => {
    const { bodyHtml } = buildNotificationMail(input({ comment: '', reasons: [] }));

    expect(bodyHtml).not.toContain('Reasons given');
    expect(bodyHtml).not.toContain('Note from the reporter');
  });

  it('escapes what the user typed, so a note cannot inject markup', () => {
    const { bodyHtml } = buildNotificationMail(input({ comment: '<img src=x onerror="alert(1)">' }));

    expect(bodyHtml).not.toContain('<img');
    expect(bodyHtml).toContain('&lt;img');
  });

  it('escapes the reported subject too', () => {
    const { bodyHtml } = buildNotificationMail(
      input({ message: { ...demoMessage, subject: 'Hi <script>bad()</script>' } }),
    );

    // The subject comes from the attacker, which is the whole reason this mail
    // exists; it must not become markup in the analyst's client.
    expect(bodyHtml).not.toContain('<script>');
  });
});
