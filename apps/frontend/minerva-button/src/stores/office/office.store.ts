import { create } from 'zustand';

import type { OfficeState } from './office.types';

/** What the store holds before the start-up gate has run. */
const EMPTY = {
  environment: null,
  message: null,
  user: null,
} as const satisfies Pick<OfficeState, 'environment' | 'message' | 'user'>;

/**
 * What the host told the pane about itself, its user and the open message.
 *
 * Read once by the route loader and then only read from. None of it can change
 * while a pane is open — Outlook does not switch application, account or item
 * underneath a running add-in; opening a different message opens a new pane. So
 * there is one write, in {@link OfficeState.setOffice}, and no subscription to
 * the host to keep anything in sync.
 *
 * Unlike the error log this is *not* persisted. It is a snapshot of one pane
 * session, and half of it — who is signed in, which message is open — is
 * mailbox content that has no business surviving in `localStorage`.
 *
 * A store rather than context because the loader fills it before any component
 * renders, which is exactly what React context cannot do.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 *
 * @example Reading it in a component
 * ```tsx
 * const message = useOfficeStore((state) => state.message);
 * ```
 *
 * @example Filling it from the loader
 * ```ts
 * useOfficeStore.getState().setOffice({ environment, message, user });
 * ```
 */
export const useOfficeStore = create<OfficeState>()((set) => ({
  ...EMPTY,

  setOffice: (office) => set(office),

  reset: () => set(EMPTY),
}));
