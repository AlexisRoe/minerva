/**
 * The task pane's Sentry adapter.
 *
 * Nothing outside this folder imports `@sentry/react`. Everything the app needs
 * is here: {@link initSentry} to start the SDK from the runtime configuration,
 * {@link SentryErrorBoundary} to catch render errors, {@link captureError} to
 * report a caught one, and {@link setBuildTags} / {@link setTag} to enrich what
 * is sent. Keeping the SDK behind this surface is what makes it possible to
 * change transport, sample rates or vendor in one place -- and what stops a
 * `captureException` somewhere in the tree from sending an event without the
 * code, fingerprint and tags every other event carries.
 *
 * The whole surface is a no-op while `sentryDsn` is `null`, which is the local
 * default: the SDK is never initialised, so events are dropped rather than sent.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/} -- the SDK
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/tags/} -- the tags set at start-up
 */

export { SentryErrorBoundary } from './error-boundary';
export { captureError } from './utils/capture-error.util';
export { initSentry } from './utils/init-sentry.util';
export { setBuildTags, setTag } from './utils/sentry-tags.util';
