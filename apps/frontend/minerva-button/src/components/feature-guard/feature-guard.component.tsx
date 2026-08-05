import type { JSX, ReactElement } from 'react';

/** What {@link FeatureGuard} needs to decide whether to draw anything. */
export interface FeatureGuardProps {
  /** The element drawn when {@link FeatureGuardProps.feature} is on. */
  children: ReactElement | ReactElement[];
  /**
   * Whether the tenant has this switched on.
   *
   * Read from `useSettings()` at the call site rather than looked up here: the
   * guard has no opinion about which flag it is guarding, which is what lets one
   * component serve every feature on the page.
   */
  feature: boolean;
}

/**
 * Draws its child only where the tenant has the feature switched on.
 *
 * A component rather than a ternary because the report page is almost entirely
 * conditional -- the spam button, the details drawer, the note, the reasons --
 * and `{flag ? <Thing /> : null}` repeated down a tree buries the markup in
 * punctuation. `<FeatureGuard feature={canReportSpam}>` says what the condition
 * *means*, and the JSX below it reads as JSX.
 *
 * It renders no element of its own -- only a fragment, which several of the
 * things it guards require: `ReportButtonList` lays its buttons out and
 * `ButtonDrawer` portals its content, so an extra *DOM* node here would change
 * the layout this is meant to be invisible to. The fragment is what lets it
 * guard more than one element at a time and still return a single JSX element.
 *
 * The check is deliberately `=== false` rather than truthiness. `feature` is
 * typed `boolean`, so anything else arriving is a bug at the call site, and
 * failing open makes that visible instead of silently hiding the feature.
 *
 * @param props The feature flag and the element it gates.
 * @returns The child, or `null` when the feature is off.
 *
 * @see {@link https://react.dev/learn/conditional-rendering}
 *
 * @example Gating one control on a tenant setting
 * ```tsx
 * const { canReportSpam } = useSettings();
 *
 * <FeatureGuard feature={canReportSpam}>
 *   <ReportButton variant="spam" title={t('report.variant.spam.title')} />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard(props: FeatureGuardProps): JSX.Element | null {
  // biome-ignore lint/complexity/noUselessFragments: I had some edge cases where that is needed
  return props.feature === false ? null : <>{props.children}</>;
}
