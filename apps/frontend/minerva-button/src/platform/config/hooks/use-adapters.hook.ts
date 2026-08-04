import { useContext } from 'react';

import type { Adapters } from '@/adapters/create-adapters.util';
import { ConfigProviderMissingError } from '@/domain/errors/config.errors';
import { ConfigContext } from '@/platform/config/provider/config.provider';

/**
 * Reads the adapter set the bootstrap built for this run of the pane.
 *
 * The one way a component or a loader reaches Office, Minerva or Graph. Built
 * once in `main.tsx` and handed down, so a screen that needs Graph gets the same
 * instance the start-up sequence used -- which is what keeps a token acquired at
 * boot warm for the move at the very end, and what stops each screen from
 * deciding demo mode for itself.
 *
 * The identity is stable for the lifetime of the pane, so it is safe as a
 * dependency of the `useMemo` that builds a loader.
 *
 * @returns The Office, Minerva and Graph adapters -- live or demo.
 * @throws {@link ConfigProviderMissingError} When called outside a `ConfigProvider`.
 *
 * @example
 * ```tsx
 * const { office, minerva, graph } = useAdapters();
 * ```
 */
export function useAdapters(): Adapters {
  const value = useContext(ConfigContext);

  if (value === null) {
    throw new ConfigProviderMissingError();
  }

  return value.adapters;
}
