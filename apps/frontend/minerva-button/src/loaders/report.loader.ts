import type { ReportingMethod, ReportingReasons } from '@minerva/typescript-lib';

import type { Adapters } from '@/adapters/create-adapters.util';
import type { GraphAdapter } from '@/adapters/graph/graph.types';
import { ReportNotificationFailedError } from '@/domain/errors/reporting.errors';
import { buildNotificationMail } from '@/domain/reporting/email-template';
import type { MethodOutcome, ReportResult } from '@/domain/reporting/reporting.types';
import { captureError } from '@/platform/sentry/utils/capture-error.util';
import { useOfficeStore } from '@/stores/office/office.store';
import { useReportStore } from '@/stores/report/report.store';
import { useSettingsStore } from '@/stores/settings/settings.store';

/**
 * Sends one notification per reporting method, in parallel.
 *
 * `allSettled` rather than `all`, and that choice is the point of this function.
 * By the time any mail is sent the report is already filed with the backend, so
 * a method that fails has lost a notification, not the report. Failing the whole
 * flow would tell the user their report did not go through, and invite them to
 * file it again -- producing a duplicate for every method that *did* work.
 *
 * Swallowed for the user is not swallowed for us: each rejection is wrapped in a
 * {@link ReportNotificationFailedError} and reported, so a mailbox that stopped
 * accepting mail is visible in Sentry and in the error log instead of only as an
 * undelivered row on a screen the user closes. One event per address rather than
 * one per submission -- a single failing method and a Graph outage are different
 * problems and should not group as one issue. The Graph error itself is kept as
 * the `cause`, so the status that explains it survives.
 *
 * @param reportId The id the backend gave the report these notify about.
 * @returns One outcome per method, in the order the tenant configured them.
 */
async function notify(
  graph: GraphAdapter,
  methods: readonly ReportingMethod[],
  reportId: string,
  build: (method: ReportingMethod) => ReturnType<typeof buildNotificationMail>,
): Promise<MethodOutcome[]> {
  const results = await Promise.allSettled(methods.map((method) => graph.sendMail(build(method))));

  return methods.map((method, index) => {
    const result = results[index];

    if (result?.status === 'rejected') {
      const cause = result.reason instanceof Error ? result.reason : undefined;

      captureError(new ReportNotificationFailedError(method.address, reportId, cause));
    }

    return { address: method.address, delivered: result?.status === 'fulfilled' };
  });
}

/**
 * Files the report the drawer collected, then notifies the tenant.
 *
 * The whole reporting flow, in the order it has to happen: download the raw
 * MIME, upload it with what the user said, then notify the tenant's reporting
 * methods with the report id stamped on each mail. The upload has to complete
 * first because it is what produces that id.
 *
 * It runs as the confirmation screen's loader rather than in a handler on the
 * report screen, which is what puts the reporting reel on screen for the whole
 * wait without either view owning a scrap of loading state -- and what lets the
 * screen that reports the outcome be the screen that produced it.
 *
 * What the user said arrives through {@link useReportStore} rather than as an
 * argument, because a loader runs outside React and the drawer is on the screen
 * the pane has just left. The draft is cleared once the report is filed: a
 * remount with a draft still in place would file it a second time.
 *
 * An empty draft resolves with `undefined` rather than failing. The confirmation
 * screen can be reached without a report -- a reopened pane -- and there is
 * nothing to file, so it says its neutral line instead.
 *
 * @param adapters The adapter set for this run of the pane.
 * @returns A loader for {@link AsyncLoading}.
 *
 * @example
 * ```tsx
 * const loader = useMemo(() => createReportLoader(adapters), [adapters]);
 *
 * <AsyncLoading loader={loader} type="report"><ConfirmationView /></AsyncLoading>
 * ```
 */
export function createReportLoader({ graph, minerva }: Adapters): () => Promise<ReportResult | undefined> {
  return async function reportLoader(): Promise<ReportResult | undefined> {
    const { draft } = useReportStore.getState();

    if (draft === null) {
      return undefined;
    }

    const { message, user } = useOfficeStore.getState();
    const { settings } = useSettingsStore.getState();

    if (message === null || user === null || settings === null) {
      // The start-up loader fills all three before the drawer can be opened, so
      // this is a wiring fault rather than a state a user can get into.
      throw new Error('A report was submitted before the pane had finished starting up.');
    }

    const mime = await graph.getMimeMessage(message.exchangeId);

    const response = await minerva.submitReport({
      file: mime,
      reportingReasons: [...draft.reasons],
      feedbackMessage: draft.comment,
      // The mailbox's own zone is what Outlook reports; this is the browser's,
      // which is what the user was actually looking at the clock in.
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userLanguage: user.displayLanguage,
      reportedAs: draft.variant,
      deliveredAt: message.receivedAt,
      exchangeId: message.exchangeId,
    });

    // Cleared the moment the report is safely filed, and before the mails go
    // out: the notifications are allowed to fail, but nothing after this point
    // may cause the report itself to be sent again.
    useReportStore.getState().reset();

    const picked = resolveReasons(settings.userFeedback.reportingReasons, draft.reasons);

    const outcomes = await notify(graph, settings.reportingMethods, response.reportId, (method) =>
      buildNotificationMail({
        method,
        message,
        user,
        reportedAs: draft.variant,
        reasons: picked,
        comment: draft.comment,
        reportId: response.reportId,
        mime,
      }),
    );

    return { response, reportedAs: draft.variant, outcomes };
  };
}

/**
 * Turns the ticked reason ids back into the reasons themselves.
 *
 * The draft carries ids because that is what the checkboxes are keyed on, but a
 * notification has to be readable by someone who has never seen this tenant's
 * configuration -- so the mail gets labels, and an id that no longer matches any
 * configured reason is dropped rather than printed raw.
 */
function resolveReasons(configured: readonly ReportingReasons[], picked: readonly string[]): ReportingReasons[] {
  return configured.filter((reason) => picked.includes(reason.value));
}
