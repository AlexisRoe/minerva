import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors around the start-up sequence's *result*.
 *
 * Distinct from the office and auth errors, which are about a step that failed:
 * these three are thrown when every call succeeded and the answers are still not
 * something the pane can run on -- a tenant that has switched the button off, a
 * user the backend declined, a session that is somehow incomplete. The sequence
 * writes nothing to the store until all three have been ruled out, so the report
 * page renders with everything in place or does not render at all.
 *
 * One subclass per {@link ErrorCode}, and one hard-coded `reference` per class:
 * the reference identifies the *throw site*, so it stays constant for a given
 * class and is generated once with `uuidgen` when the class is written -- never
 * at runtime, or a log line could no longer be traced back to a line of code.
 *
 * @see {@link ./auth.errors.ts} -- the same pattern, for signing in
 * @see {@link ../../loaders/bootstrap.loader.ts} -- the only place the first two are thrown
 */

/**
 * The settings arrived, and say the button is switched off for this tenant.
 *
 * Not a failure: the tenant has deliberately turned the add-in off, and the
 * backend answering `enabled: false` is it doing its job. The pane still has to
 * stop, because everything past this point offers a user a button their own
 * organisation has withdrawn -- so it lands on the no-content screen, which says
 * "not here" without a retry rather than "something broke".
 *
 * A warning rather than an error for the same reason: a tenant with the button
 * off should not fill Sentry with issues.
 */
export class ButtonDisabledError extends MinervaError {
  constructor(cause?: Error) {
    super({
      reference: 'b9126e0c-bad1-4b7f-a411-7dca882423cd',
      code: 'ERR_017',
      message: 'Minerva is switched off for your organisation.',
      logLevel: 'warn',
      payload: { enabled: false },
      cause,
    });
  }
}

/**
 * The backend validated the token and still refused the user.
 *
 * A valid sign-in is not permission: the token can be genuine while the user is
 * outside whatever the tenant licensed or assigned. Every later API call would
 * be refused, so the sequence stops here rather than rendering a page whose
 * every action fails one at a time.
 *
 * Not retryable -- pressing again re-presents the same identity -- and reported
 * as an error, because a user who is meant to have the add-in and cannot use it
 * is something an administrator has to fix.
 */
export class SessionNotAuthorizedError extends MinervaError {
  constructor(sessionId = '', cause?: Error) {
    super({
      reference: '4653b242-74f0-4e6a-baac-54ce2724b8be',
      code: 'ERR_018',
      message: 'Your account is not allowed to use Minerva.',
      logLevel: 'error',
      payload: { sessionId },
      cause,
    });
  }
}

/**
 * Something read the pane session before the start-up sequence had filled it.
 *
 * Pure wiring, and unreachable by a user: the sequence writes all three slices
 * in one go and the report page only renders behind it, so meeting this means a
 * route or a flow was mounted outside that gate. `payload.missing` names the
 * slices that were absent, which is what turns "it was empty" into a place to
 * look.
 *
 * Fatal rather than recoverable, for the same reason `OfficeNotReadyError` is:
 * there is no user action that fixes it.
 */
export class SessionIncompleteError extends MinervaError {
  constructor(reader = '', missing: readonly string[] = [], cause?: Error) {
    super({
      reference: '74e2c19c-e396-475a-abed-bf20a8167526',
      code: 'ERR_019',
      message: 'Minerva could not start.',
      logLevel: 'fatal',
      payload: { reader, missing: missing.join(', ') },
      cause,
    });
  }
}
