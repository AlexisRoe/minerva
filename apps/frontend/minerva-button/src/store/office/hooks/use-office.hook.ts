import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '../../../adapters/office';
import { useOfficeStore } from '../office.store';

/** What {@link useOffice} returns. */
export interface UseOffice {
  /** What Outlook this is, or `null` before the start-up gate has run. */
  readonly environment: OfficeEnvironment | null;
  /** The message the pane was opened on, or `null` when it was not opened on one. */
  readonly message: OutlookMessage | null;
  /** Who has the pane open, or `null` before it has been read. */
  readonly user: OutlookUser | null;
  /** Whether the host has been read and a message is actually open. */
  readonly hasMessage: boolean;
}

/**
 * Reads what the host reported, for the views.
 *
 * The read side of {@link useOfficeStore}: writing stays with the route loader,
 * which is what keeps this a snapshot of one pane session rather than something
 * any component can quietly change. Each field is selected separately so a
 * component re-renders on the one it actually reads.
 *
 * @returns The environment, the message, the user, and whether there is a
 * message to report at all.
 *
 * @see {@link https://zustand.docs.pmnd.rs/guides/updating-state} -- selectors and re-renders
 *
 * @example
 * ```tsx
 * const { message, hasMessage } = useOffice();
 *
 * if (!hasMessage) return <NoContentView title={t('no-message')} />;
 * return <Text>{message.subject}</Text>;
 * ```
 */
export function useOffice(): UseOffice {
  const environment = useOfficeStore((state) => state.environment);
  const message = useOfficeStore((state) => state.message);
  const user = useOfficeStore((state) => state.user);

  return { environment, message, user, hasMessage: message !== null };
}
