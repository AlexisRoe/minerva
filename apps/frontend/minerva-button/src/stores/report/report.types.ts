import type { ReportVariant } from '@/domain/reporting/reporting.types';

/**
 * What the report drawer collected, once the user pressed send.
 *
 * The whole input to the reporting flow: which button was pressed, which reasons
 * were ticked, and what was written in the note. Everything else the flow needs
 * -- the message, the user, the tenant's settings -- is already in a store of
 * its own by the time this is filled.
 */
export interface ReportDraft {
  /** Which button was pressed. */
  readonly variant: ReportVariant;
  /** The reason ids the user ticked; empty when reasons are off or none was picked. */
  readonly reasons: readonly string[];
  /** The free-text note, empty when none was written or none was asked for. */
  readonly comment: string;
}

/** The state and actions {@link useReportStore} exposes. */
export interface ReportState {
  /** What is being filed, or `null` when no report is in flight. */
  readonly draft: ReportDraft | null;
  /** Records what the drawer collected, just before the confirmation screen opens. */
  readonly setDraft: (draft: ReportDraft) => void;
  /** Returns the store to its empty state. */
  readonly reset: () => void;
}
