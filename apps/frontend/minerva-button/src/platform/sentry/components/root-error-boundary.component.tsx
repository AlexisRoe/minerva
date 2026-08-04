import { Component, type ErrorInfo, type ReactNode } from 'react';

import { showBootError } from '@/platform/boot/show-boot-error.util';
import { captureError } from '@/platform/sentry/utils/capture-error.util';

/** What {@link RootErrorBoundary} needs. */
export interface RootErrorBoundaryProps {
  /** The providers, and the app under them. */
  children: ReactNode;
}

/** What the boundary holds once it has caught something. */
interface RootErrorBoundaryState {
  /** Whether something below has thrown; the error itself is not kept. */
  failed: boolean;
}

/**
 * The outermost boundary, and the one that renders nothing.
 *
 * It sits above every provider so that a throw from {@link ConfigProvider},
 * {@link I18nProvider} or {@link MinervaThemeProvider} is still caught. That
 * position is exactly what makes a React fallback the wrong answer here: a
 * fallback drawn at this depth would have to render the ui-lib under a theme
 * provider that has just been shown to throw, and a fallback that throws escapes
 * to nothing at all -- the boundary is already in its error state, so the user
 * gets a blank pane instead of a message.
 *
 * So this one renders `null` and delegates to {@link showBootError}, which fills
 * in markup `index.html` already carries. Nothing is rendered, so nothing is
 * left that can fail: the last-resort screen holds even when the bundle that
 * would have drawn it is what broke.
 *
 * Everything below the providers is guarded by {@link MinervaErrorBoundary}
 * instead, which *can* draw a styled screen because it renders inside them. This
 * boundary is what catches what that one cannot see.
 *
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 *
 * @example
 * ```tsx
 * <RootErrorBoundary>
 *   <I18nProvider>{tree}</I18nProvider>
 * </RootErrorBoundary>
 * ```
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  override state: RootErrorBoundaryState = { failed: false };

  /** Unmounts the broken tree on the same commit the error was thrown in. */
  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { failed: true };
  }

  /**
   * Reports the error, then paints the screen it belongs to.
   *
   * Both happen here rather than in `render` because both are side effects: one
   * sends an event, the other writes to the document. The event id is therefore
   * on screen from the first paint of the failure, which the React fallback
   * below cannot manage -- it renders once before the report is in.
   */
  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    showBootError(error, captureError(error));
    console.error('Minerva root error', info.componentStack);
  }

  override render(): ReactNode {
    // `null`, not a fallback: the screen for this is the document's, not React's.
    return this.state.failed ? null : this.props.children;
  }
}
