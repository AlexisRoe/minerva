import { useContext } from 'react';

import type { AppConfig } from '../config.types';
import { ConfigContext } from '../provider/config.provider';

/**
 * Reads the runtime configuration, or `null` where there may not be one.
 *
 * The deliberate exception to {@link useConfig}, which throws off-provider
 * because rendering outside {@link ConfigProvider} is a wiring mistake
 * everywhere it can be one. It cannot be one above the provider: the error
 * boundary in `main.tsx` sits above every provider on purpose, so that a
 * provider throwing is still caught -- and its fallback therefore renders with
 * no configuration on context by design rather than by accident.
 *
 * Use this only in that position, and only for something the screen can do
 * without. Anything that needs the configuration to be correct should keep
 * throwing.
 *
 * @returns The validated configuration, or `null` when there is no provider above.
 *
 * @see {@link https://react.dev/reference/react/useContext}
 *
 * @example
 * ```tsx
 * const config = useOptionalConfig();
 * const canRetry = config !== null && config.retry < MAX_RETRY;
 * ```
 */
export function useOptionalConfig(): AppConfig | null {
  return useContext(ConfigContext);
}
