import { createContext, type ReactElement, type ReactNode, useMemo } from 'react';

import type { Adapters } from '@/adapters/create-adapters.util';
import type { AppConfig } from '@/platform/config/config.types';

/** What the bootstrap assembled before React mounted, in one value. */
export interface ConfigContextValue {
  /** The configuration fetched at start-up. */
  readonly config: AppConfig;
  /** The adapter set chosen from it -- live or demo, decided once. */
  readonly adapters: Adapters;
}

/**
 * Holds what the bootstrap produced: the configuration and the adapters built from it.
 *
 * The two travel together because the second is a function of the first, and
 * splitting them into two contexts would only create a state where a component
 * can see a configuration whose adapters are somebody else's -- exactly the
 * half-demo pane the adapter seam exists to rule out.
 *
 * `null` is the "no provider above me" marker that lets `useConfig()` and
 * `useAdapters()` throw instead of handing out a half-empty object. Not
 * re-exported from a barrel: the hooks are the only intended readers, and
 * keeping the context out of the public surface is what stops a component from
 * calling `useContext` on it and quietly reintroducing the nullable type.
 */
export const ConfigContext = createContext<ConfigContextValue | null>(null);

export interface ConfigProviderProps {
  /** The configuration fetched at start-up. */
  readonly config: AppConfig;
  /** The adapter set to serve the whole tree, built once by the bootstrap. */
  readonly adapters: Adapters;
  /** The tree that may read them. */
  readonly children: ReactNode;
}

/**
 * Puts the runtime configuration and the adapter set on React's context.
 *
 * Mounted by the bootstrap around the whole tree once the fetch has resolved,
 * so anything below it can rely on both being present. Passing them in rather
 * than building them here keeps the component synchronous and lets a test or a
 * story render a subtree against any configuration and any fake it likes.
 *
 * The value is memoised on its two parts: a fresh object every render would
 * re-fire the loader effect in every `AsyncLoading` below, which for the
 * reporting loader would mean filing the report twice.
 *
 * @see {@link https://react.dev/reference/react/createContext}
 *
 * @example
 * ```tsx
 * <ConfigProvider adapters={createAdapters(config)} config={config}>
 *   <App />
 * </ConfigProvider>
 * ```
 */
export function ConfigProvider({ config, adapters, children }: ConfigProviderProps): ReactElement {
  const value = useMemo<ConfigContextValue>(() => ({ config, adapters }), [config, adapters]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
