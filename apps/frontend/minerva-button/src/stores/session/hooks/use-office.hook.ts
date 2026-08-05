import type { OfficeEnvironment, OutlookMessage, OutlookUser } from '@/adapters/office/office.types';
import { useSessionStore } from '@/stores/session/session.store';

/** What {@link useOffice} returns. */
export interface UseOffice {
  /** What Outlook this is, or `null` before the start-up sequence has finished. */
  readonly environment: OfficeEnvironment | null;
  /** The message the pane was opened on, or `null` when it was not opened on one. */
  readonly message: OutlookMessage | null;
  /** Who has the pane open, or `null` before the start-up sequence has finished. */
  readonly user: OutlookUser | null;
  /** Whether the host has been read and a message is actually open. */
  readonly hasMessage: boolean;
}

/**
 * Reads what the host reported, for the views.
 *
 * One of the three read-side hooks over {@link useSessionStore}, and the reason
 * merging the stores did not merge the hooks: a view that draws the message does
 * not want the tenant's settings handed to it, and selecting only the `office`
 * slice is what keeps it from re-rendering on anything else. Writing stays with
 * the start-up loader, which is what keeps this a snapshot of one pane session
 * rather than something any component can quietly change.
 *
 * The fields stay nullable even though the loader fills them all before the
 * report page renders. Not every caller is behind that gate -- a test, a story,
 * the error screen -- and a type that lied about it would move the crash from
 * here to a component.
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
  const office = useSessionStore((state) => state.office);

  return {
    environment: office?.environment ?? null,
    message: office?.message ?? null,
    user: office?.user ?? null,
    hasMessage: (office?.message ?? null) !== null,
  };
}
