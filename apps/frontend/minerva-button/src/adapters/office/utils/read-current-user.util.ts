import { convertMicrosoftLanguagetoInternalLanguage } from '@minerva/typescript-lib';

import { OfficeNotReadyError } from '../../../errors';
import type { OutlookUser } from '../office.types';

/**
 * Reads who has the pane open, as Outlook reports them.
 *
 * Synchronous for the same reason `readCurrentMessage()` is: the start-up gate
 * has already awaited `waitForOffice()`, so waiting again here would only mask
 * being called without it. That case throws instead.
 *
 * Unlike the message this has no nullable outcome. A mailbox always has an
 * owner, so an absent `userProfile` is not "no user" -- it is the host not being
 * ready, which is the same wiring fault and reported the same way.
 *
 * Deliberately taken from the host and not from Graph: this runs before the user
 * has been signed in, and the pane needs a name, an address and a language to
 * show something meaningful while that is still happening. The authenticated
 * profile arrives later and separately.
 *
 * `displayLanguage` is kept in both forms on purpose. The full BCP-47 tag is
 * what the reporting request sends, because the backend picks its templates by
 * region as well as language; the reduced {@link Languages} value is what the
 * i18n catalogues are keyed by. Reducing early would lose `en-GB`; reducing
 * never would mean every reader of the field has to know how.
 *
 * @returns The mailbox owner.
 * @throws {OfficeNotReadyError} When called before the start-up gate has run.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.userprofile} -- the fields read here
 * @see {@link https://learn.microsoft.com/javascript/api/office/office.context#office-office-context-displaylanguage-member} -- `displayLanguage` and its tag format
 *
 * @example
 * ```ts
 * await waitForOffice();
 * const user = readCurrentUser();
 * ```
 */
export function readCurrentUser(): OutlookUser {
  const context = typeof Office === 'undefined' ? undefined : Office.context;
  const profile = context?.mailbox?.userProfile;
  if (context === undefined || profile === undefined) {
    throw new OfficeNotReadyError('readCurrentUser');
  }

  const displayLanguage = context.displayLanguage ?? '';

  return {
    name: profile.displayName ?? '',
    email: profile.emailAddress ?? '',
    timeZone: profile.timeZone ?? '',
    displayLanguage,
    language: convertMicrosoftLanguagetoInternalLanguage(displayLanguage),
  };
}
