/**
 * Components shared between the task pane's screens.
 *
 * Anything a single view owns lives beside that view instead. What lands here is
 * what more than one screen needs, or -- as with {@link FeatureGuard} -- what
 * exists to make the screens themselves readable.
 *
 * The visual components come from `@minerva/ui-lib`; this folder is for the
 * small app-specific pieces that have no place in a design system.
 */

export type { FeatureGuardProps } from './feature-guard/feature-guard.component';
export { FeatureGuard } from './feature-guard/feature-guard.component';
