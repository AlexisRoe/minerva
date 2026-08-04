import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors for the half of reporting that is best-effort.
 *
 * Everything else in this catalogue is thrown to stop something. This one is
 * built to be *reported* and then dropped: by the time a notification is sent
 * the report is already filed with the backend, so a failed mail has cost a
 * notification, not the report, and failing the action over it would invite the
 * user to file a duplicate.
 *
 * @see {@link ./request.errors.ts} -- the error the Graph call itself raised, kept as the `cause`
 */

/**
 * A tenant reporting method could not be notified.
 *
 * One address failing says something different from all of them failing -- a
 * mistyped mailbox in the tenant's configuration versus a Graph outage or a
 * missing `Mail.Send` consent -- so the address travels in the payload and every
 * failure is reported separately rather than summarised into one event.
 *
 * A warning, not an error: the user's report went through, and nothing here is
 * on the path they are waiting on. It is worth a look at the tenant's settings,
 * not a page.
 */
export class ReportNotificationFailedError extends MinervaError {
  constructor(address: string, reportId: string, cause?: Error) {
    super({
      reference: 'f6b1c48a-9d27-4e53-8a10-7c3e5b0d29f4',
      code: 'ERR_016',
      message: 'A reporting method could not be notified.',
      logLevel: 'warn',
      payload: { address, reportId },
      cause,
    });
  }
}
