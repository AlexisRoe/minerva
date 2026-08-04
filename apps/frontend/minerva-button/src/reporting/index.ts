/**
 * What happens between the user pressing send and the confirmation screen.
 *
 * Two things live here rather than in the action itself: the notification
 * template, because what a security queue is told is a product decision and not
 * a routing one, and the shapes that decision produces.
 *
 * The order of the flow is in `src/routing/actions/report.action.ts`; this is
 * what that flow says.
 */

export type { NotificationInput } from './email-template';
export { buildNotificationMail } from './email-template';
export type { MethodOutcome, ReportResult } from './reporting.types';
export {
  ATTACHMENT_NAME,
  REPORT_ID_HEADER,
  REPORTED_BY,
  REPORTED_BY_HEADER,
} from './reporting.types';
