import * as Sentry from '@sentry/react';

/**
 * Sentry's React error boundary, re-exported so `@sentry/react` stays behind
 * this folder.
 *
 * A render that throws below this component is reported and replaced by the
 * `fallback` instead of unmounting the tree -- React gives no other way to catch
 * a render error, which is why this is a component rather than a call to
 * {@link captureError}.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/}
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 *
 * @example
 * ```tsx
 * <SentryErrorBoundary fallback={<p>{translate('error')}</p>}>
 *   <App />
 * </SentryErrorBoundary>
 * ```
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
