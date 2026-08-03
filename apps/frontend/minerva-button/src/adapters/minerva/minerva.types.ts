/**
 * Where the Minerva API is reached, relative to the deployed pane.
 *
 * A same-origin path rather than an absolute URL: the pane and the API are
 * served from the configured `appDomain`, so the browser sends no preflight and
 * the same artefact works in every environment. If they ever diverge, this
 * becomes an entry in `config.entries.ts` and moves into `AppConfig`.
 */
export const MINERVA_API_PATH = '/api';

/** What the pane asks Minerva to turn into a work item. */
export interface WorkItemDraft {
  /** The Office.js `itemId`, so the backend can trace it back to the mailbox. */
  readonly messageId: string;
  /** The message subject. */
  readonly subject: string;
  /** The sender's address. */
  readonly from: string;
  /** The message body, as Graph returned it. */
  readonly body: string;
}

/** What Minerva answers with once the draft is queued. */
export interface WorkItemReceipt {
  /** The identifier the user can quote when asking after the item. */
  readonly workItemId: string;
  /** When it was accepted, as an ISO-8601 string. */
  readonly acceptedAt: string;
}
