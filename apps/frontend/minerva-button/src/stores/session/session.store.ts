import { create } from 'zustand';

import type { SessionState } from './session.types';

/** What the store holds before the start-up sequence has finished. */
const EMPTY = {
  office: null,
  auth: null,
  settings: null,
} as const satisfies Pick<SessionState, 'office' | 'auth' | 'settings'>;

/**
 * Everything one pane session is: the host, the sign-in and the tenant's settings.
 *
 * One store rather than three, because the three were never independent. All of
 * them are filled by the same start-up sequence, in the same tick, and none of
 * them means anything without the others -- a message with no settings cannot be
 * reported, and settings with no session cannot be acted on. Three stores made
 * that look like eight possible states when there are only two: nothing, and
 * everything.
 *
 * Which is exactly how it is written. {@link SessionState.setSession} takes the
 * whole {@link SessionData} and there is no partial setter, so the loader can
 * only write once it has all of it. Anything that renders after the start-up
 * gate therefore sees all three or none.
 *
 * Each part stays its own object -- `office`, `auth`, `settings` -- so a
 * component that reads one of them re-renders on that one, and so the three
 * read-side hooks each select a single slice rather than picking fields out of a
 * flat bag.
 *
 * Not persisted, and emphatically so. Half of it is mailbox content and the
 * other half is a session; either one surviving in `localStorage` would be
 * something left behind on a shared machine. The settings are not cached either:
 * a tenant can change them at any time, and a stale copy would send reports to
 * an address nobody is monitoring.
 *
 * A store rather than context because the loader fills it before any component
 * renders, which is exactly what React context cannot do.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 *
 * @example Reading a slice in a component
 * ```tsx
 * const message = useSessionStore((state) => state.office?.message ?? null);
 * ```
 *
 * @example Filling it from the loader, once everything has landed
 * ```ts
 * useSessionStore.getState().setSession({ office, auth, settings });
 * ```
 */
export const useSessionStore = create<SessionState>()((set) => ({
  ...EMPTY,

  setSession: (session) => set(session),

  reset: () => set(EMPTY),
}));
