import type { ReportVariant } from '../../store';

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
 * Builds the action the report drawer submits to.
 *
 * Currently it only reads the intent back and hands it to the confirmation
 * screen. The reporting work itself -- downloading the MIME, uploading the
 * report, fanning notification mails out over the tenant's reporting methods --
 * is the next step, and lands inside this function.
 *
 * It is an action rather than a handler in the view for one reason that is worth
 * keeping: React Router holds the transition non-idle for as long as an action
 * runs, which is what puts the reporting reel on screen without the view owning
 * any loading state.
 *
 * @returns A React Router action.
 *
 * @see {@link https://reactrouter.com/start/data/route-object#action}
 *
 * @example
 * ```ts
 * { path: ROUTES.confirmation, Component: ConfirmationView, action: createReportAction() }
 * ```
 */
export function createReportAction() {
  return async function reportAction({ request }: { request: Request }): Promise<ReportIntent> {
    return readReportIntent(await request.formData());
  };
}
