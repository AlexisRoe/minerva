import { NoContentView } from '@minerva/ui-lib';
import { useSearchParams } from 'react-router';

import { useTranslations } from '../../i18n';
import { REASON_PARAM } from '../../routing';

/**
 * The i18n key each start-up failure explains itself with.
 *
 * Keyed by error code rather than by a reason of its own invention: the codes
 * already exist, are already unique, and are already what a support call quotes.
 * A code with no entry here falls back to the generic line, so adding an error
 * cannot leave a blank screen.
 */
const REASON_KEYS = {
  ERR_007: 'unsupported-timeout',
  ERR_008: 'unsupported-host',
  ERR_009: 'unsupported-requirement-set',
} as const;

/** What is said when the reason is missing or not one we know. */
const FALLBACK_KEY = 'unsupported-generic';

/**
 * The screen for a pane that cannot run where it has been opened.
 *
 * Reached by a redirect from the start-up loader, never by a thrown error --
 * which is the whole point of it existing separately from {@link ErrorView}.
 * Nothing has broken: the pane is outside Outlook, or on a client too old for
 * the requirement set, or Office.js could not be fetched. None of that is worth
 * a retry button, so this screen offers none.
 *
 * The specific reason travels in the query string as an error code, because a
 * redirect cannot carry anything else and the loader's `MinervaError` does not
 * survive it.
 *
 * @see {@link https://reactrouter.com/api/hooks/useSearchParams}
 *
 * @example
 * ```tsx
 * { path: ROUTES.unsupported, Component: UnsupportedView }
 * ```
 */
export function UnsupportedView() {
  const { t } = useTranslations();
  const [searchParams] = useSearchParams();

  const reason = searchParams.get(REASON_PARAM) ?? '';
  const key = REASON_KEYS[reason as keyof typeof REASON_KEYS] ?? FALLBACK_KEY;

  return <NoContentView description={t(key)} title={t('unsupported-title')} />;
}
