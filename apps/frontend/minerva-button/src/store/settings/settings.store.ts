import { create } from 'zustand';

import type { SettingsState } from './settings.types';

/**
 * The tenant's button configuration, as fetched at start-up.
 *
 * Almost every decision the two screens make comes from here: which buttons
 * exist, which reasons can be picked, whether a reason is compulsory, where the
 * report is sent, what the confirmation screen offers afterwards. Fetching it is
 * the last step of the boot sequence, and the report page does not render until
 * it has landed -- a pane that rendered first and reconfigured itself afterwards
 * would show the user buttons that then moved.
 *
 * Not persisted. A tenant can change these at any time, and a stale cached copy
 * would send reports to an address that is no longer monitored.
 *
 * @see {@link https://zustand.docs.pmnd.rs/getting-started/introduction}
 *
 * @example Filling it from the loader
 * ```ts
 * useSettingsStore.getState().setSettings(await minerva.getSettings({ userLanguage }));
 * ```
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,

  setSettings: (settings) => set({ settings }),

  reset: () => set({ settings: null }),
}));
