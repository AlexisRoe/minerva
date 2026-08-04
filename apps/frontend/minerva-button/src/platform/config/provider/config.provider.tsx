import { createContext, type ReactElement, type ReactNode } from 'react';

import type { AppConfig } from '@/platform/config/config.types';

/**
 * Holds the configuration the bootstrap loaded.
 *
 * `null` is the "no provider above me" marker that lets `useConfig()` throw
 * instead of handing out a half-empty object. Not re-exported from the barrel:
 * the hook is the only intended reader, and keeping the context out of the
 * public surface is what stops a component from calling `useContext` on it and
 * quietly reintroducing the nullable type.
 */
export const ConfigContext = createContext<AppConfig | null>(null);

export interface ConfigProviderProps {
  /** The configuration fetched at start-up. */
  readonly config: AppConfig;
  /** The tree that may read it. */
  readonly children: ReactNode;
}

/**
 * Puts the runtime configuration on React's context.
 *
 * Mounted by the bootstrap around the whole tree once the fetch has resolved,
 * so anything below it can rely on the configuration being present. Passing the
 * value in rather than fetching it here keeps the component synchronous and lets
 * a test or a story render a subtree against any configuration it likes.
 *
 * @see {@link https://react.dev/reference/react/createContext}
 *
 * @example
 * ```tsx
 * <ConfigProvider config={await loadConfig()}>
 *   <App />
 * </ConfigProvider>
 * ```
 */
export function ConfigProvider({ config, children }: ConfigProviderProps): ReactElement {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}
