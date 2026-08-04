import type { ReportingMethod, ReportingReasons } from '@minerva/typescript-lib';

import type { GraphAdapter } from '../../adapters/graph';
import type { AppConfig } from '../../config';
import { buildNotificationMail } from '../../reporting/email-template';
import type { MethodOutcome, ReportResult } from '../../reporting/reporting.types';
import { type ReportVariant, useOfficeStore, useSettingsStore } from '../../store';
import { createPaneAdapters } from '../loaders/report.loader';

/** What the report drawer collected, once the form data has been read back. */
export interface ReportIntent {
  /** Which button was pressed. */
  readonly variant: ReportVariant;
  /** The reason ids the user ticked; empty when reasons are off or none was picked. */
  readonly reasons: readonly string[];
  /** The free-text note, empty when none was written or none was asked for. */
  readonly comment: string;
}

/** The variants a submitted form is allowed to name. */
const VARIANTS = new Set<ReportVariant>(['suspicious', 'spam']);

/**
 * Reads a submitted report drawer back into a {@link ReportIntent}.
 *
 * Form data is stringly typed and arrives from the browser, so this narrows
 * rather than casts. `variant` is checked against the two the contract allows
 * and falls back to the stricter of them: a report that reached here is a report
 * the user meant to file, so a malformed variant should not lose it -- and
 * `suspicious` is the one that does not require the tenant to have enabled
 * anything.
 *
 * `reasons` is read with `getAll`, because the view appends one field per pick.
 *
 * @param formData The body React Router handed the action.
 * @returns What the user asked for.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/FormData/getAll}
 *
 * @example
 * ```ts
 * const intent = readReportIntent(await request.formData());
 * ```
 */
export function readReportIntent(formData: FormData): ReportIntent {
  const variant = String(formData.get('variant') ?? '') as ReportVariant;

  return {
    variant: VARIANTS.has(variant) ? variant : 'suspicious',
    reasons: formData.getAll('reasons').map(String),
    comment: String(formData.get('comment') ?? ''),
  };
}

/**
 * Sends one notification per reporting method, in parallel.
 *
 * `allSettled` rather than `all`, and that choice is the point of this function.
 * By the time any mail is sent the report is already filed with the backend, so
 * a method that fails has lost a notification, not the report. Failing the whole
 * action would tell the user their report did not go through, and invite them to
 * file it again -- producing a duplicate for every method that *did* work.
 *
 * @returns One outcome per method, in the order the tenant configured them.
 */
async function notify(
  graph: GraphAdapter,
  methods: readonly ReportingMethod[],
  build: (method: ReportingMethod) => ReturnType<typeof buildNotificationMail>,
): Promise<MethodOutcome[]> {
  const results = await Promise.allSettled(methods.map((method) => graph.sendMail(build(method))));

  return methods.map((method, index) => ({
    address: method.address,
    delivered: results[index]?.status === 'fulfilled',
  }));
}

/**
 * Builds the action the report drawer submits to.
 *
 * The whole reporting flow, in the order it has to happen: download the raw
 * MIME, upload it with what the user said, then notify the tenant's reporting
 * methods with the report id stamped on each mail. The upload has to complete
 * first because it is what produces that id.
 *
 * It is an action rather than a handler in the view for one reason worth
 * keeping: React Router holds the transition non-idle for as long as an action
 * runs, which is what puts the reporting reel on screen without the view owning
 * any loading state.
 *
 * It returns rather than redirects. The plan called for
 * `redirect('/confirmation')` carrying the outcome, but a redirect carries
 * nothing except a URL -- and this action is already mounted *on* the
 * confirmation route, so what it returns is exactly what that screen reads
 * through `useActionData()`.
 *
 * @param config The configuration the app booted with.
 * @returns A React Router action.
 *
 * @see {@link https://reactrouter.com/start/data/route-object#action}
 * @see {@link https://reactrouter.com/api/hooks/useActionData}
 *
 * @example
 * ```ts
 * { path: ROUTES.confirmation, Component: ConfirmationView, action: createReportAction(config) }
 * ```
 */
export function createReportAction(config: AppConfig) {
  return async function reportAction({ request }: { request: Request }): Promise<ReportResult> {
    const intent = readReportIntent(await request.formData());

    const { environment, message, user } = useOfficeStore.getState();
    const { settings } = useSettingsStore.getState();

    if (environment === null || message === null || user === null || settings === null) {
      // The start-up loader fills all four before this screen can be reached, so
      // this is a wiring fault rather than a state a user can get into.
      throw new Error('A report was submitted before the pane had finished starting up.');
    }

    const { graph, minerva } = createPaneAdapters(config, environment);

    const mime = await graph.getMimeMessage(message.exchangeId);

    const response = await minerva.submitReport({
      file: mime,
      reportingReasons: [...intent.reasons],
      feedbackMessage: intent.comment,
      // The mailbox's own zone is what Outlook reports; this is the browser's,
      // which is what the user was actually looking at the clock in.
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userLanguage: user.displayLanguage,
      reportedAs: intent.variant,
      deliveredAt: message.receivedAt,
      exchangeId: message.exchangeId,
    });

    const picked = resolveReasons(settings.userFeedback.reportingReasons, intent.reasons);

    const outcomes = await notify(graph, settings.reportingMethods, (method) =>
      buildNotificationMail({
        method,
        message,
        user,
        reportedAs: intent.variant,
        reasons: picked,
        comment: intent.comment,
        reportId: response.reportId,
        mime,
      }),
    );

    return { response, reportedAs: intent.variant, outcomes };
  };
}

/**
 * Turns the ticked reason ids back into the reasons themselves.
 *
 * The form carries ids because that is what the checkboxes are keyed on, but a
 * notification has to be readable by someone who has never seen this tenant's
 * configuration -- so the mail gets labels, and an id that no longer matches any
 * configured reason is dropped rather than printed raw.
 */
function resolveReasons(configured: readonly ReportingReasons[], picked: readonly string[]): ReportingReasons[] {
  return configured.filter((reason) => picked.includes(reason.value));
}
