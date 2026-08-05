import { demoMessage } from './office.fixture';

/**
 * The raw MIME the demo Graph adapter hands back for {@link demoMessage}.
 *
 * A real RFC 5322 message rather than a placeholder string, headers included:
 * this blob is what the demo attaches to the notification mails as an `.eml`, so
 * if it were not parseable the one part of the flow hardest to check by eye
 * would be the part that is fake.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322}
 */
export const DEMO_MIME_CONTENT = [
  `Message-ID: ${demoMessage.internetMessageId}`,
  `Date: Mon, 3 Aug 2026 09:42:00 +0200`,
  `From: "IT Support" <${demoMessage.from}>`,
  `To: "Ada Lovelace" <ada.lovelace@contoso.example>`,
  `Subject: ${demoMessage.subject}`,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',
  'Received: from mail.contoso-billing.example (203.0.113.42)',
  '  by mx.contoso.example with ESMTPS; Mon, 3 Aug 2026 09:42:00 +0200',
  'Authentication-Results: mx.contoso.example; spf=fail; dkim=none; dmarc=fail',
  '',
  'Your mailbox has exceeded its quota and will be suspended within 24 hours.',
  'Confirm your credentials here to keep your account active:',
  'https://contoso-billing.example/verify?id=8f2c41d9',
  '',
  '-- IT Support',
  '',
].join('\r\n');

/**
 * Builds the demo MIME blob.
 *
 * A function rather than a constant because a `Blob` is consumable -- reading it
 * for the upload and again for the attachment must not race over one instance --
 * and because `Blob` does not exist when this module is evaluated in a Node
 * context.
 *
 * @returns The demo email as `message/rfc822`.
 *
 * @example
 * ```ts
 * const mime = createDemoMime();
 * ```
 */
export function createDemoMime(): Blob {
  return new Blob([DEMO_MIME_CONTENT], { type: 'message/rfc822' });
}
