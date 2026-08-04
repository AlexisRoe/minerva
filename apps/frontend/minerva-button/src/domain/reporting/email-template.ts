import type { ReportingMethod, ReportingReasons } from '@minerva/typescript-lib';

import type { NotificationMail } from '@/adapters/graph/graph.types';
import type { OutlookMessage, OutlookUser } from '@/adapters/office/office.types';
import type { ReportVariant } from '@/stores/settings/settings.types';
import { ATTACHMENT_NAME, REPORT_ID_HEADER, REPORTED_BY, REPORTED_BY_HEADER } from './reporting.types';

/** Everything the template needs to describe one report. */
export interface NotificationInput {
  /** Which of the tenant's reporting methods this mail is for. */
  readonly method: ReportingMethod;
  /** The message being reported. */
  readonly message: OutlookMessage;
  /** Who reported it. */
  readonly user: OutlookUser;
  /** What they filed it as. */
  readonly reportedAs: ReportVariant;
  /** The reasons they ticked, already resolved to their labels. */
  readonly reasons: readonly ReportingReasons[];
  /** Their free-text note, empty when there is none. */
  readonly comment: string;
  /** The id the backend gave the report. */
  readonly reportId: string;
  /** The raw email, attached when the method asks for it. */
  readonly mime: Blob;
}

/** Escapes text for interpolation into the HTML body. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** One `<dt>/<dd>` pair, or nothing when there is no value to show. */
function row(label: string, value: string): string {
  return value === '' ? '' : `<dt><strong>${label}</strong></dt><dd>${escapeHtml(value)}</dd>`;
}

/**
 * Builds the notification email for one reporting method.
 *
 * The body is written for whoever opens it in a security queue rather than for
 * the user who filed it: what was reported, by whom, as what, and why. It is
 * deliberately **not** translated. These go to a shared mailbox that may be read
 * by a team, or by an MSSP in another country, and a report arriving in the
 * reporter's language would be a report nobody can triage -- the reporter's
 * language is recorded as a field instead.
 *
 * Two headers mark provenance. Graph will only carry headers that are
 * `X-`-prefixed, and at most five of them, so these are kept to the two that
 * cannot be recovered from the body: what filed it, and which record it belongs
 * to. A mail rule keys on the first; an investigator quotes the second.
 *
 * The original email is attached as an `.eml` only when the method asks for it.
 * Some queues parse the attachment and some forward the notification onward, so
 * this is per-method rather than global.
 *
 * @param input What to say, and which method to say it for.
 * @returns The mail, ready for `graph.sendMail`.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/internetmessageheader}
 *
 * @example
 * ```ts
 * await graph.sendMail(buildNotificationMail({ method, message, user, ... }));
 * ```
 */
export function buildNotificationMail(input: NotificationInput): NotificationMail {
  const { method, message, user, reportedAs, reasons, comment, reportId, mime } = input;

  const reasonList =
    reasons.length === 0
      ? ''
      : `<ul>${reasons.map((reason) => `<li>${escapeHtml(reason.defaultLabel)}</li>`).join('')}</ul>`;

  const bodyHtml = [
    `<p>A user reported the attached message as <strong>${escapeHtml(reportedAs)}</strong>.</p>`,
    '<dl>',
    row('Reported by', `${user.name} <${user.email}>`),
    row('Report id', reportId),
    row('Subject', message.subject),
    row('From', message.from),
    row('Received', message.receivedAt),
    row('Message-ID', message.internetMessageId),
    row('Reporter language', user.displayLanguage),
    '</dl>',
    reasonList === '' ? '' : `<p><strong>Reasons given</strong></p>${reasonList}`,
    comment === '' ? '' : `<p><strong>Note from the reporter</strong></p><p>${escapeHtml(comment)}</p>`,
  ]
    .filter((part) => part !== '')
    .join('');

  return {
    to: method.address,
    // The prefix is the tenant's, verbatim: their mail rules match on it, so a
    // separator added here would silently stop those rules firing.
    subject: `${method.subjectPrefix}${message.subject}`,
    bodyHtml,
    headers: {
      [REPORTED_BY_HEADER]: REPORTED_BY,
      [REPORT_ID_HEADER]: reportId,
    },
    attachment: method.attachOriginalEmail
      ? { name: ATTACHMENT_NAME, contentType: 'message/rfc822', content: mime }
      : undefined,
  };
}
