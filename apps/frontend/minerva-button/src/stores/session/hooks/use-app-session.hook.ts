import { type UseOffice, useOffice } from './use-office.hook';
import { type UseSession, useSession } from './use-session.hook';
import { type UseSettings, useSettings } from './use-settings.hook';

/** What {@link useAppSession} returns. */
export interface UseAppSession {
  /** What the host reported, as {@link useOffice} gives it. */
  readonly office: UseOffice;
  /** Who is signed in, as {@link useSession} gives it. */
  readonly session: UseSession;
  /** The tenant's configuration, as {@link useSettings} gives it. */
  readonly settings: UseSettings;
}

/**
 * Reads the whole pane session at once: host, sign-in and settings.
 *
 * For the callers that genuinely need all three -- the details drawer, a support
 * dump, a debug screen -- and that would otherwise call the three hooks in a row
 * and reassemble them by hand. It composes them rather than reading the store
 * itself, so the derived answers (`hasMessage`, `canReportSpam`, `isAuthorized`)
 * are computed in exactly one place.
 *
 * Kept nested rather than flattened into one bag: `user` means two different
 * things across these slices -- the mailbox owner Outlook reports and the
 * profile the backend confirmed -- and a flat object would have to rename one of
 * them and lose the distinction.
 *
 * Prefer the narrow hook where a component only needs one slice. This one
 * subscribes to all three, so it re-renders on any of them.
 *
 * @returns The three slices, each already reduced for the views.
 *
 * @example
 * ```tsx
 * const { office, session, settings } = useAppSession();
 *
 * <SupportDetails
 *   host={office.environment?.host}
 *   sessionId={session.sessionId}
 *   methods={settings.reportingMethods}
 * />
 * ```
 */
export function useAppSession(): UseAppSession {
  return {
    office: useOffice(),
    session: useSession(),
    settings: useSettings(),
  };
}
