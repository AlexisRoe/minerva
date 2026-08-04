import { create } from 'zustand';

import type { ReportState } from './report.types';

/**
 * The report the user is filing, between the drawer and the confirmation screen.
 *
 * The channel that used to be a form body. The drawer and the reporting flow are
 * on two different screens, and the pane navigates between them, so what the
 * user said has to survive the navigation -- a store rather than router state
 * because the flow runs outside React, in a loader, and reads it with
 * `useReportStore.getState()`.
 *
 * Not persisted, and cleared as soon as the report is filed: a draft that
 * outlived its submission would let a remount file the same report twice.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 *
 * @example Filling it from the drawer
 * ```ts
 * useReportStore.getState().setDraft({ variant: 'spam', reasons: ['unwanted'], comment: '' });
 * ```
 */
export const useReportStore = create<ReportState>()((set) => ({
  draft: null,

  setDraft: (draft) => set({ draft }),

  reset: () => set({ draft: null }),
}));
