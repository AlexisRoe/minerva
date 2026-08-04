import type { MinervaButtonSettings } from '@minerva/typescript-lib';

/**
 * What the user is reporting an email as.
 *
 * The same two values `ReportingFormData.reportedAs` carries, named here because
 * the report page picks one per button and the confirmation page branches on it.
 */
export type ReportVariant = 'suspicious' | 'spam';

/** The state and actions {@link useSettingsStore} exposes. */
export interface SettingsState {
  /** The tenant's configuration, or `null` before the loader has fetched it. */
  readonly settings: MinervaButtonSettings | null;
  /** Records the fetched settings. */
  readonly setSettings: (settings: MinervaButtonSettings) => void;
  /** Returns the store to its empty state. Used by tests and by a retry. */
  readonly reset: () => void;
}
