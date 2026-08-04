import { createGraphDemoAdapter } from '@/adapters/graph/graph.demo';
import { createGraphHttpAdapter } from '@/adapters/graph/graph.http';
import type { GraphAdapter } from '@/adapters/graph/graph.types';
import { createMinervaDemoAdapter } from '@/adapters/minerva/minerva.demo';
import { createMinervaHttpAdapter } from '@/adapters/minerva/minerva.http';
import type { MinervaAdapter } from '@/adapters/minerva/minerva.types';
import { createOfficeDemoAdapter } from '@/adapters/office/office.demo';
import { createOfficeLiveAdapter } from '@/adapters/office/office.live';
import type { OfficeAdapter } from '@/adapters/office/office.types';
import type { AppConfig } from '@/platform/config/config.types';

/** Everything outside the pane's own code it talks to. */
export interface Adapters {
  /** The Office host: the message, the user, sign-in, and closing the pane. */
  readonly office: OfficeAdapter;
  /** Minerva's own API. */
  readonly minerva: MinervaAdapter;
  /** Microsoft Graph. */
  readonly graph: GraphAdapter;
}

/**
 * Chooses the adapter set this run of the pane will use.
 *
 * The single place demo mode is decided, and the reason it costs nothing
 * elsewhere: loaders and views are handed an {@link Adapters} and cannot tell
 * whether it reaches the network. `config.demo` is already the conjunction of
 * the deployment's `allowDemo` and `?demo=true`, so there is no second check to
 * make here -- `loadConfig` has done it.
 *
 * All three are chosen together, never mixed. A half-demo pane would send real
 * mail about a fixture email, which is exactly the accident this seam exists to
 * rule out.
 *
 * Graph's tokens come from the Office adapter rather than from a provider passed
 * in, which is what lets this be a function of the configuration alone: sign-in
 * needs the environment Office reports, and the Office adapter is the thing that
 * holds it. Built once in `main.tsx` and handed down through the config context,
 * so the token acquired at start-up is still cached when the confirmation screen
 * moves the mail.
 *
 * @param config The configuration the app booted with.
 * @returns The adapter set to use for the lifetime of the pane.
 *
 * @example
 * ```ts
 * const adapters = createAdapters(config);
 * const settings = await adapters.minerva.getSettings({ userLanguage });
 * ```
 */
export function createAdapters(config: AppConfig): Adapters {
  if (config.demo) {
    return {
      office: createOfficeDemoAdapter(),
      minerva: createMinervaDemoAdapter(),
      graph: createGraphDemoAdapter().adapter,
    };
  }

  const office = createOfficeLiveAdapter(config);

  return {
    office,
    minerva: createMinervaHttpAdapter(),
    graph: createGraphHttpAdapter(() => office.acquireToken()),
  };
}
