import type { UserProfile } from '@minerva/typescript-lib';

import type { AuthFlow } from '@/auth-dialog/types/auth.types';
import { useSessionStore } from '@/stores/session/session.store';

/** What {@link useSession} returns. */
export interface UseSession {
  /** Who is signed in, or `null` before sign-in has completed. */
  readonly userProfile: UserProfile | null;
  /** Which sign-in flow produced the session, or `null` before sign-in. */
  readonly flow: AuthFlow | null;
  /** The session id, quoted in reports and worth showing when support is called. */
  readonly sessionId: string | null;
  /** Whether the backend accepted the token and the pane may call the API. */
  readonly isAuthorized: boolean;
}

/**
 * Reads the current session, for the views.
 *
 * The read side of {@link useSessionStore}. `isAuthorized` is deliberately the
 * backend's own answer rather than "is there an authorization object": the
 * backend can accept a token as valid and still refuse the user, and a pane that
 * treated the two as the same would go on to make calls that all fail.
 *
 * @returns The profile, the flow, the session id and whether the API may be called.
 *
 * @see {@link https://zustand.docs.pmnd.rs/guides/updating-state} -- selectors and re-renders
 *
 * @example
 * ```tsx
 * const { userProfile, isAuthorized } = useSession();
 * ```
 */
export function useSession(): UseSession {
  const authorization = useSessionStore((state) => state.authorization);
  const flow = useSessionStore((state) => state.flow);

  return {
    userProfile: authorization?.userProfile ?? null,
    flow,
    sessionId: authorization?.sessionId ?? null,
    isAuthorized: authorization?.isAuthorized ?? false,
  };
}
