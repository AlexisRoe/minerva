import { MinervaThemeProvider } from '@minerva/ui-lib';

import { ErrorScreen } from './error-screen.component';

/** What {@link BootstrapErrorView} needs -- exactly what the boundary hands its fallback. */
export interface BootstrapErrorViewProps {
  /** Whatever was thrown below the boundary. */
  readonly error: unknown;
  /**
   * Sentry's event id for it, once `componentDidCatch` has reported it.
   *
   * `undefined` on the first render after the throw: the fallback is shown
   * during the same commit the error was caught in, and the report goes out
   * after it. The line appears on the re-render that follows.
   */
  readonly errorId?: string | undefined;
}

/**
 * The screen behind a failure that took the whole tree down with it.
 *
 * {@link MinervaErrorBoundary}'s fallback, and the last thing this app can draw.
 * Everything it shows is {@link ErrorScreen} -- the same screen a failed loader
 * lands on -- because a user cannot tell which layer broke and should not have
 * to: one Minerva, whether the failure was anticipated or not.
 *
 * What is left here is the two things that screen cannot do for itself in this
 * position. It brings a {@link MinervaThemeProvider}, because the boundary sits
 * above every provider in `main.tsx` -- deliberately, so that a provider
 * throwing is still caught -- and without one the panel would draw unstyled at
 * the exact moment looking broken is least affordable. And it passes the error
 * and its event id straight through, so the code and the reference a user is
 * asked to quote are on screen for a render crash exactly as they are for a
 * loader failure.
 *
 * Translation needs nothing: `initReactI18next` registers the instance globally,
 * so `useTranslations` answers off-provider. The configuration does not, and
 * {@link ErrorScreen} degrades to offering no retry when it is absent.
 *
 * @example
 * ```tsx
 * <MinervaErrorBoundary fallback={(error, errorId) => <BootstrapErrorView error={error} errorId={errorId} />}>
 * ```
 */
export function BootstrapErrorView({ error, errorId }: BootstrapErrorViewProps) {
  return (
    <MinervaThemeProvider>
      <ErrorScreen error={error} errorId={errorId} />
    </MinervaThemeProvider>
  );
}
