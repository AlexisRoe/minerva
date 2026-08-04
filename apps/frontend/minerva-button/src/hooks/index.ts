/**
 * Hooks shared across views.
 *
 * A view is composition; anything it *does* lives here, so the rules survive a
 * change to how the screen looks and can be tested without a render tree.
 */

export type { MessageDisposition } from './use-message-disposition.hook';
export { DISPOSITION, useMessageDisposition } from './use-message-disposition.hook';
export type { ReportReasonOption, ReportSubmission } from './use-report-submission.hook';
export { useReportSubmission } from './use-report-submission.hook';
