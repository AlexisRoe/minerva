import type { AuthorizationResult } from '@minerva/typescript-lib';

import type { AuthFlow } from '@/auth-dialog/types/auth.types';

/** The state and actions {@link useSessionStore} exposes. */
export interface SessionState {
  /** What the backend answered when it validated the token, or `null` before sign-in. */
  readonly authorization: AuthorizationResult | null;
  /** Which sign-in flow produced the session, or `null` before sign-in. */
  readonly flow: AuthFlow | null;
  /** Records a completed sign-in, in one write. */
  readonly setSession: (session: Pick<SessionState, 'authorization' | 'flow'>) => void;
  /** Returns the store to its empty state. Used by tests and by a retry. */
  readonly reset: () => void;
}
