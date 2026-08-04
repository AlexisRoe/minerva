import type { AppConfig } from '../config';
import { createGraphDemoAdapter } from './graph/graph.demo';
import { createGraphHttpAdapter } from './graph/graph.http';
import type { AccessTokenProvider, GraphAdapter } from './graph/graph.types';
import { createMinervaDemoAdapter } from './minerva/minerva.demo';
import { createMinervaHttpAdapter } from './minerva/minerva.http';
import type { MinervaAdapter } from './minerva/minerva.types';

/** Everything outside the browser the task pane talks to. */
export interface Adapters {
  /** Minerva's own API. */
  readonly minerva: MinervaAdapter;
  /** Microsoft Graph. */
  readonly graph: GraphAdapter;
}

/**
 * Chooses the adapter set this run of the pane will use.
 *
 * The single place demo mode is decided, and the reason it costs nothing
 * elsewhere: loaders, actions and views are handed an {@link Adapters} and
 * cannot tell whether it reaches the network. `config.demo` is already the
 * conjunction of the deployment's `allowDemo` and `?demo=true`, so there is no
 * second check to make here -- `loadConfig` has done it.
 *
 * Both sets are chosen together, never mixed. A half-demo pane would send real
 * mail about a fixture email, which is exactly the accident this seam exists to
 * rule out.
 *
 * @param config The configuration the app booted with.
 * @param getAccessToken Supplies Graph tokens; never called in demo mode.
 * @returns The adapter set to use for the lifetime of the pane.
 *
 * @example
 * ```ts
 * const adapters = createAdapters(config, () => acquireToken(environment));
 * const settings = await adapters.minerva.getSettings({ userLanguage });
 * ```
 */
export function createAdapters(config: AppConfig, getAccessToken: AccessTokenProvider): Adapters {
  if (config.demo) {
    return {
      minerva: createMinervaDemoAdapter(),
      graph: createGraphDemoAdapter().adapter,
    };
  }

  return {
    minerva: createMinervaHttpAdapter(),
    graph: createGraphHttpAdapter(getAccessToken),
  };
}
