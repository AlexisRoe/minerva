import type { WellKnownFolder } from '@/adapters/graph/graph.types';
import type { ReportVariant } from '@/domain/reporting/reporting.types';
import type { TranslationKey } from '@/platform/i18n/utils/translate.util';

const TRASH_FOLDER: WellKnownFolder = 'deleteditems';
const SPAM_FOLDER: WellKnownFolder = 'junkemail';

/**
 * Where each report sends the mail, and what the button offering it says.
 *
 * Suspicious mail is deleted and spam is filed under junk, which is what the two
 * reports mean to a mailbox: one is a threat to be rid of, the other is noise to
 * be trained on. Both names are Graph's well-known folders, which is the only
 * form that works for every user without a lookup.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/mailfolder}
 */
export const DISPOSITION = Object.freeze({
  suspicious: { folder: TRASH_FOLDER, labelKey: 'confirmation.disposition.delete' },
  spam: { folder: SPAM_FOLDER, labelKey: 'confirmation.disposition.spam' },
} as const satisfies Record<ReportVariant, { folder: WellKnownFolder; labelKey: TranslationKey }>);
