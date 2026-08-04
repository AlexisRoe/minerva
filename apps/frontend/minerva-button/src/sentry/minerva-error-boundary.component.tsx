import { Component, type ErrorInfo, type ReactNode } from 'react';

import { captureError } from './utils/capture-error.util';

/** What {@link MinervaErrorBoundary} needs. */
export interface MinervaErrorBoundaryProps {
  /** The tree to guard. */
  children: ReactNode;
  /**
   * What to show instead once something below has thrown.
   *
   * A function of the error rather than a fixed node, because the screen wants
   * to say different things about a {@link MinervaError} and a plain one -- and
   * a boundary that swallowed the error could not tell the difference.
   *
   * The second argument is Sentry's event id for the occurrence, which is what a
   * user should be given to quote. It is `undefined` on the first render after
   * the throw, because the error is reported in `componentDidCatch` -- after the
   * fallback has already been shown once.
   */
  fallback: (error: unknown, errorId: string | undefined) => ReactNode;
}

/** What the boundary holds once it has caught something. */
interface MinervaErrorBoundaryState {
  /** The error, or `null` while the tree below is healthy. */
  error: unknown;
  /** Sentry's event id, once the error has been reported. */
  errorId: string | undefined;
}

/**
 * Catches a render error anywhere below it and hands it to the fallback.
 *
 * A class component because React offers no other way: hooks cannot catch a
 * render error, and `getDerivedStateFromError` has no function equivalent. This
 * replaces the plain re-export of `Sentry.ErrorBoundary`, which could not do the
 * one thing this app needs -- pass the error *out* so the screen can branch on
 * whether it is one of ours.
 *
 * Reporting goes through {@link captureError} rather than Sentry's own boundary,
 * and the two are deliberately not nested: `captureError` already does the
 * Minerva-vs-plain enrichment (severity from `logLevel`, `code` and `reference`
 * as tags and fingerprint, `payload` as extra) and writes the persisted error
 * log. Wrapping this in `Sentry.ErrorBoundary` as well would send every event
 * twice, once enriched and once not.
 *
 * Sentry's React integration does not capture render errors on its own, so the
 * explicit call in `componentDidCatch` is what makes them reportable at all.
 *
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/}
 *
 * @example
 * ```tsx
 * <MinervaErrorBoundary fallback={(error) => <ErrorScreen error={error} />}>
 *   <App />
 * </MinervaErrorBoundary>
 * ```
 */
export class MinervaErrorBoundary extends Component<MinervaErrorBoundaryProps, MinervaErrorBoundaryState> {
  override state: MinervaErrorBoundaryState = { error: null, errorId: undefined };

  /** Switches to the fallback on the same commit the error was thrown in. */
  static getDerivedStateFromError(error: unknown): Pick<MinervaErrorBoundaryState, 'error'> {
    return { error };
  }

  /**
   * Reports the error, once it is safe to.
   *
   * Separate from `getDerivedStateFromError` because that runs during the render
   * phase, where side effects are not allowed and React may call it twice.
   */
  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.setState({ errorId: captureError(error) });
    console.error('Minerva render error', info.componentStack);
  }

  override render(): ReactNode {
    // `null` is the healthy state; anything else is a caught error, including the
    // falsy values a `throw 0` or `throw ''` would produce.
    return this.state.error === null ? this.props.children : this.props.fallback(this.state.error, this.state.errorId);
  }
}
