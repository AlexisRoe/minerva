import * as Sentry from '@sentry/react';

import type { RuntimeConfig } from '../../config';

/**
 * Tags every event with what the runtime configuration says about this build.
 *
 * Tags are indexed, so these are what a search or an alert rule can filter on --
 * `app:@minerva/manager version:0.1.0` narrows an issue to one deployment
 * without opening a single event. `release` and `environment` are set by
 * `Sentry.init()` and are not repeated here; what these add is the app's own
 * identity and the build it came from, which matters as soon as a second
 * Minerva frontend reports into the same project.
 *
 * `buildTime` is a tag rather than context on purpose: "did this start after the
 * 14:02 build?" is the question actually asked when something breaks after a
 * deploy, and only a tag can answer it in a search.
 *
 * Called by {@link initSentry} straight after `init`, so the very first event of
 * a session already carries them.
 *
 * @param config - The configuration fetched at start-up.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/tags/}
 * @see {@link https://docs.sentry.io/concepts/search/} -- what the tags become searchable as
 *
 * @example
 * ```ts
 * setBuildTags(config); // app, version, buildTime, mode on every later event
 * ```
 */
export function setBuildTags(config: RuntimeConfig): void {
  Sentry.setTags({
    app: config.name,
    version: config.version,
    buildTime: config.buildTime,
    mode: config.mode,
  });
}

/**
 * Adds one tag to every event sent from here on.
 *
 * The escape hatch for things only known later -- which view the user was on
 * when it broke, which feature flag is on. Keep the values low-cardinality
 * and free of PII: Sentry indexes each distinct value, and a tag holding an
 * address or an id makes a mess of both search and quota. Anything unbounded
 * belongs in an error's `payload`, which travels as unindexed extra data.
 *
 * @param key - Tag name, e.g. `'view'`.
 * @param value - Tag value; `undefined` removes the tag.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/tags/}
 *
 * @example
 * ```ts
 * setTag('view', 'inbox');
 * ```
 */
export function setTag(key: string, value: string | undefined): void {
  Sentry.setTag(key, value);
}
