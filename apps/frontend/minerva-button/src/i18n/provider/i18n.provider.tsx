import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18next from '../i18next.instance';

export interface I18nProviderProps {
  readonly children: ReactNode;
}

/**
 * Puts the configured i18next instance on React's context.
 *
 * The hooks in this folder fall back to a module-level instance when no provider
 * is present, which works but leaves the instance implicit. Mounting this at the
 * top of the tree makes the dependency explicit, and it is what lets a test or a
 * story render a subtree against a different instance without touching global
 * state.
 *
 * It also guarantees ordering: rendering the provider means the catalogues are
 * registered before any child calls `t()`, instead of relying on the side effect
 * of some import having run first.
 *
 * @param children - The tree that may translate.
 *
 * @see {@link https://react.i18next.com/latest/i18nextprovider}
 *
 * @example
 * ```tsx
 * <I18nProvider>
 *   <TaskPane />
 * </I18nProvider>
 * ```
 */
export function I18nProvider({ children }: I18nProviderProps) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
