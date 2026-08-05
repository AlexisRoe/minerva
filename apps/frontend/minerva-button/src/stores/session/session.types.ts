import type { AuthorizationResult, MinervaButtonSettings } from '@minerva/typescript-lib';

import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '@/adapters/office/office.types';
import type { AuthFlow } from '@/auth-dialog/types/auth.types';

/**
 * What the host told the pane about itself, its user and the open message.
 *
 * None of it can change while a pane is open -- Outlook does not switch
 * application, account or item underneath a running add-in; opening a different
 * message opens a new pane. So this is a snapshot of one pane session, written
 * once and only read afterwards.
 */
export interface OfficeData {
  /** What Outlook this is. */
  readonly environment: OfficeEnvironment;
  /** The message the pane was opened on, or `null` when it was not opened on one. */
  readonly message: OutlookMessage | null;
  /** Who has the pane open. */
  readonly user: OutlookUser;
}

/**
 * Who is signed in, for as long as this pane is open.
 *
 * Note what is *not* here: the access token. The pane's own session is an
 * httpOnly cookie the backend sets, which JavaScript cannot read and does not
 * need to -- `request()` sends it automatically. Graph tokens are held by MSAL,
 * which knows when they expire and this store would not. Keeping either one here
 * would mean holding a credential that goes stale without telling anyone.
 */
export interface AuthData {
  /** What the backend answered when it validated the token. */
  readonly authorization: AuthorizationResult;
  /** Which sign-in flow produced the session. */
  readonly flow: AuthFlow;
}

/**
 * Everything the start-up sequence produced, in one value.
 *
 * The unit the store is written in: the pane either learned all three of these
 * or it did not start, so there is no state in which one is filled and another
 * is not.
 */
export interface SessionData {
  /** What the host reported. */
  readonly office: OfficeData;
  /** What signing in produced. */
  readonly auth: AuthData;
  /** The tenant's button configuration, already checked to be `enabled`. */
  readonly settings: MinervaButtonSettings;
}

/** The state and actions {@link useSessionStore} exposes. */
export interface SessionState {
  /** What the host reported, or `null` before the start-up sequence has finished. */
  readonly office: OfficeData | null;
  /** The signed-in session, or `null` before the start-up sequence has finished. */
  readonly auth: AuthData | null;
  /** The tenant's configuration, or `null` before the start-up sequence has finished. */
  readonly settings: MinervaButtonSettings | null;
  /** Records the whole start-up result, in one write. */
  readonly setSession: (session: SessionData) => void;
  /** Returns the store to its empty state. Used by tests and by a retry. */
  readonly reset: () => void;
}
