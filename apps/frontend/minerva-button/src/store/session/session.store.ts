import { create } from 'zustand';

import type { SessionState } from './session.types';

/** What the store holds before sign-in has completed. */
const EMPTY = {
  authorization: null,
  flow: null,
} as const satisfies Pick<SessionState, 'authorization' | 'flow'>;

/**
 * Who is signed in, for as long as this pane is open.
 *
 * Note what is *not* here: the access token. The pane's own session is an
 * httpOnly cookie the backend sets, which JavaScript cannot read and does not
 * need to -- `request()` sends it automatically. Graph tokens are held by MSAL,
 * which knows when they expire and this store would not. Keeping either one here
 * would mean holding a credential that goes stale without telling anyone.
 *
 * Not persisted, and emphatically so. A session that outlived the pane in
 * `localStorage` would be a credential left on a shared machine.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 *
 * @example Reading it in a component
 * ```tsx
 * const name = useSessionStore((state) => state.authorization?.userProfile.name);
 * ```
 *
 * @example Filling it from the loader
 * ```ts
 * useSessionStore.getState().setSession({ authorization, flow });
 * ```
 */
export const useSessionStore = create<SessionState>()((set) => ({
  ...EMPTY,

  setSession: (session) => set(session),

  reset: () => set(EMPTY),
}));
