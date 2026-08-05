import type { ReportingResponse } from '@minerva/typescript-lib';

/**
 * What the user is reporting an email as.
 *
 * The same two values `ReportingFormData.reportedAs` carries, named here because
 * the report page picks one per button, the confirmation page branches on it,
 * and the disposition hook maps it to a mailbox folder -- so it belongs to the
 * reporting domain rather than to whichever store happened to hold it.
 */
export type ReportVariant = 'suspicious' | 'spam';

/** How one of the tenant's reporting methods fared. */
export interface MethodOutcome {
  /** Where the notification was addressed. */
  readonly address: string;
  /** Whether Graph accepted it. */
  readonly delivered: boolean;
}

/**
 * Everything the confirmation screen needs to say what happened.
 *
 * Returned by the reporting action rather than carried in a redirect, because a
 * redirect carries nothing but a URL -- and the interesting half of this is the
 * per-method outcome, which cannot be reconstructed from anywhere else.
 */
export interface ReportResult {
  /** What the backend answered, including the report id and what it recognised. */
  readonly response: ReportingResponse;
  /** What the user filed it as, which the confirmation screen branches on. */
  readonly reportedAs: ReportVariant;
  /** One entry per reporting method, in the order the tenant configured them. */
  readonly outcomes: readonly MethodOutcome[];
}

/** The header naming what filed a report, so a rule can key on it. */
export const REPORTED_BY_HEADER = 'X-Minerva-Reported-By';

/** The header carrying the report id, so a mail can be traced back to its record. */
export const REPORT_ID_HEADER = 'X-Minerva-Report-Id';

/** What {@link REPORTED_BY_HEADER} is set to. */
export const REPORTED_BY = 'minerva-button';

/** The filename the original email is attached under. */
export const ATTACHMENT_NAME = 'reported-email.eml';
