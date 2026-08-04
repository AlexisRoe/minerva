import type { ReportButtonVariant, UserFeedbackValue } from '@minerva/ui-lib';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/constants/routes.constants';
import { useReportStore } from '@/stores/report/report.store';
import { useSettings } from '@/stores/settings/hooks/use-settings.hook';

/** One tickable reason, as the feedback block wants it. */
export interface ReportReasonOption {
  /** The id submitted for this reason. */
  readonly value: string;
  /** What the user reads next to the checkbox. */
  readonly label: string;
}

/** Everything the report drawer needs to run, and nothing the page needs to know about. */
export interface ReportSubmission {
  /** Which report is being filed, or `null` when the drawer is shut. */
  readonly filing: ReportButtonVariant | null;
  /**
   * The reasons the tenant configured for whatever is being filed; empty when nothing is.
   *
   * A mutable array, unlike everything else here, because that is what the
   * feedback block's prop asks for.
   */
  readonly reasons: ReportReasonOption[];
  /** Whether the drawer has collected enough to be sent. */
  readonly canSend: boolean;
  /** Opens the drawer for a variant. Pass straight to `ReportButton`'s `onReport`. */
  readonly startReport: (variant: ReportButtonVariant) => void;
  /** Records what the feedback block currently holds. */
  readonly setFeedback: (value: UserFeedbackValue) => void;
  /** Shuts the drawer and forgets what was in it. */
  readonly cancelReport: () => void;
  /** Files the report, then shuts the drawer. */
  readonly sendReport: () => void;
}

/**
 * Owns the report drawer: what is being filed, what the user said, and sending it.
 *
 * Lifted out of the view so that file is composition and this one is behaviour.
 * The view had three pieces of state and two handlers whose only connection to
 * the JSX was the props they are passed, which made the drawer's rules -- what
 * makes a report sendable, what a cancel forgets, how reasons reach the wire --
 * something you had to read the render tree to find.
 *
 * Sending does not call an adapter. It writes the draft to
 * {@link useReportStore} and navigates to {@link ROUTES.confirmation}, whose
 * loader runs the actual flow: download the MIME, upload the report, mail the
 * tenant's reporting methods. That indirection is deliberate and is why no
 * adapter appears here -- the confirmation screen sits behind an `AsyncLoading`,
 * which shows the reporting reel for as long as the flow runs, so neither this
 * hook nor the view owns a scrap of loading state.
 *
 * A store rather than router state because the flow runs outside React and reads
 * it with `getState()` -- and because a draft in the history entry would be
 * re-submitted by a back navigation.
 *
 * @returns The drawer's state and the three things that can be done to it.
 *
 * @see {@link https://reactrouter.com/api/hooks/useNavigate}
 *
 * @example
 * ```tsx
 * const { filing, reasons, canSend, startReport, sendReport } = useReportSubmission();
 *
 * <ReportButton onReport={startReport} variant="suspicious" ... />
 * <ButtonDrawer opened={filing !== null} ... />
 * ```
 */
export function useReportSubmission(): ReportSubmission {
  const navigate = useNavigate();
  const { reasonsFor } = useSettings();

  const [filing, setFiling] = useState<ReportButtonVariant | null>(null);
  const [feedback, setFeedback] = useState<UserFeedbackValue | null>(null);

  /** Drops both pieces of drawer state, so the next report opens blank. */
  function cancelReport(): void {
    setFiling(null);
    setFeedback(null);
  }

  function sendReport(): void {
    if (filing === null || feedback === null) {
      return;
    }

    useReportStore.getState().setDraft({
      variant: filing,
      reasons: [...feedback.reasons],
      comment: feedback.comment,
    });

    void navigate(ROUTES.confirmation);
    cancelReport();
  }

  return {
    filing,
    reasons: filing === null ? [] : reasonsFor(filing).map(({ value, label }) => ({ value, label })),
    canSend: feedback?.isValid === true,
    startReport: setFiling,
    setFeedback,
    cancelReport,
    sendReport,
  };
}
