import { useContext } from 'react';

import { ConfigProviderMissingError } from '../../errors';
import type { AppConfig } from '../config.types';
import { ConfigContext } from '../provider/config.provider';

/**
 * Reads the runtime configuration published by the Vite `runtimeConfig()` plugin.
 *
 * The return type is not nullable: the bootstrap fetches the document before it
 * renders anything and fails loudly if it cannot, so by the time a component
 * runs the configuration exists. Rendering outside {@link ConfigProvider} is a
 * wiring mistake and throws rather than degrading.
 *
 * @returns The validated configuration.
 * @throws {@link ConfigProviderMissingError} When called outside a {@link ConfigProvider}.
 *
 * @see {@link https://react.dev/reference/react/useContext}
 *
 * @example
 * ```tsx
 * const { version, mode } = useConfig();
 * ```
 */
export function useConfig(): AppConfig {
  const config = useContext(ConfigContext);

  if (config === null) {
    throw new ConfigProviderMissingError();
  }

  return config;
}
