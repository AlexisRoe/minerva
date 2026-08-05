import type { Contact, MinervaButtonSettings, ReportingMethod, ReportingReasons } from '@minerva/typescript-lib';

import type { ReportVariant } from '@/domain/reporting/reporting.types';
import { useSessionStore } from '@/stores/session/session.store';

/** What {@link useSettings} returns. */
export interface UseSettings {
  /** The whole configuration, or `null` before the start-up sequence has finished. */
  readonly settings: MinervaButtonSettings | null;
  /** Whether the button is switched on for this tenant at all. */
  readonly isEnabled: boolean;
  /** Whether the details drawer should be offered. */
  readonly canShowDetails: boolean;
  /** Whether the spam button should be rendered beside the suspicious one. */
  readonly canReportSpam: boolean;
  /** Whether the confirmation screen should show a contact block. */
  readonly hasContact: boolean;
  /** The contact block, or `null` when it is switched off or absent. */
  readonly contact: Contact | null;
  /** Where reports are sent; empty before the settings have landed. */
  readonly reportingMethods: readonly ReportingMethod[];
  /** Whether the user must pick at least one reason before submitting. */
  readonly isReasonMandatory: boolean;
  /** Whether the free-text field is offered. */
  readonly hasFreetextField: boolean;
  /** The reasons offered for one variant; empty when reasons are switched off. */
  readonly reasonsFor: (variant: ReportVariant) => readonly ReportingReasons[];
}

/**
 * The empty answers returned while the settings have not landed yet.
 *
 * Two constants rather than one shared `[]`, so each keeps its element type --
 * and module-level rather than inline, so a component that reads one of them
 * twice is not re-rendered by a new array identity each time.
 */
const NO_REASONS: readonly ReportingReasons[] = [];
const NO_METHODS: readonly ReportingMethod[] = [];

/**
 * Reads the tenant configuration, already reduced to the questions views ask.
 *
 * The `settings` slice of {@link useSessionStore}, and deliberately more than a
 * passthrough. Views ask "should the spam button exist?", not "is
 * `features.enableSpamReporting` true, and are the settings loaded yet?" -- so
 * the nesting and the `null` are collapsed here rather than at a dozen call
 * sites, each of which would have to get the `null` case right on its own.
 *
 * Every flag answers `false` and every list answers empty before the settings
 * land. That is the safe direction: a pane that briefly showed nothing is
 * recoverable, a pane that briefly offered a button the tenant disabled is not.
 * `isEnabled` is the same answer twice over -- the start-up loader refuses to
 * store a configuration that is switched off, so a rendered pane always reads
 * `true` here.
 *
 * @returns The configuration and the derived answers the two screens need.
 *
 * @see {@link https://zustand.docs.pmnd.rs/guides/updating-state} -- selectors and re-renders
 *
 * @example
 * ```tsx
 * const { canReportSpam, reasonsFor } = useSettings();
 *
 * {canReportSpam ? <ReportButton variant="spam" reasons={reasonsFor('spam')} /> : null}
 * ```
 */
export function useSettings(): UseSettings {
  const settings = useSessionStore((state) => state.settings);

  const contact = settings?.contact.enable === true ? settings.contact : null;

  return {
    settings,
    isEnabled: settings?.enabled ?? false,
    canShowDetails: settings?.features.enableEmailDetails ?? false,
    canReportSpam: settings?.features.enableSpamReporting ?? false,
    hasContact: contact !== null,
    contact,
    reportingMethods: settings?.reportingMethods ?? NO_METHODS,
    isReasonMandatory: settings?.userFeedback.isReportingReasonMandatory ?? false,
    hasFreetextField: settings?.userFeedback.enableFreetextField ?? false,

    reasonsFor: (_variant: ReportVariant) => {
      const feedback = settings?.userFeedback;

      // The contract carries one list, not one per variant. The parameter is
      // taken anyway because the two drawers each ask for their own reasons, and
      // the day the backend splits the list this changes here and nowhere else.
      if (feedback === undefined || !feedback.enabled || !feedback.enableReportingReasons) {
        return NO_REASONS;
      }

      return feedback.reportingReasons;
    },
  };
}
