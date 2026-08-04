import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '../../adapters/office';

/** The state and actions {@link useOfficeStore} exposes. */
export interface OfficeState {
  /** What Outlook this is, or `null` before the start-up gate has run. */
  readonly environment: OfficeEnvironment | null;
  /** The message the pane was opened on, or `null` when it was not opened on one. */
  readonly message: OutlookMessage | null;
  /** Who has the pane open, or `null` before it has been read. */
  readonly user: OutlookUser | null;
  /** Records everything the start-up gate learned from the host, in one write. */
  readonly setOffice: (office: Pick<OfficeState, 'environment' | 'message' | 'user'>) => void;
  /** Returns the store to its empty state. Used by tests and by a retry. */
  readonly reset: () => void;
}
