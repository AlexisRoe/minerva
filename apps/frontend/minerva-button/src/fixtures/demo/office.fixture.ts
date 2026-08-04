import { Languages } from '@minerva/typescript-lib';

import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '@/adapters/office/office.types';

/**
 * An Outlook the pane is happy to run in.
 *
 * NAA is on, which is the path a modern client actually takes; the dialog
 * fallback is exercised by overriding this rather than by making it the default,
 * so the demo shows the common case.
 */
export const demoEnvironment: OfficeEnvironment = {
  host: 'Outlook',
  platform: 'OfficeOnline',
  naaSupported: true,
};

/**
 * The email the demo reports.
 *
 * Written as something a user would plausibly forward to security -- a
 * credential-harvesting lure with a lookalike sender -- so a walkthrough shows
 * the product doing its job rather than reporting `Test 123`.
 */
export const demoMessage: OutlookMessage = {
  id: 'AAMkADhkYzQ0ZTBhLTQ2ZmMtNDE0YS05YzQxLWQ0N2M2ZDIwNTgxNAB=',
  exchangeId: 'AAMkADhkYzQ0ZTBhLTQ2ZmMtNDE0YS05YzQxLWQ0N2M2ZDIwNTgxNABGAAAAAAA=',
  internetMessageId: '<8f2c41d9-7a3e-4b60-9f18-2d5a7c04e1b3@mail.contoso-billing.example>',
  subject: 'Action required: your mailbox will be suspended in 24 hours',
  from: 'it-support@contoso-billing.example',
  receivedAt: '2026-08-03T07:42:00.000Z',
};

/** Who has the demo pane open. */
export const demoUser: OutlookUser = {
  name: 'Ada Lovelace',
  email: 'ada.lovelace@contoso.example',
  timeZone: 'W. Europe Standard Time',
  displayLanguage: 'en-GB',
  language: Languages.English,
};
