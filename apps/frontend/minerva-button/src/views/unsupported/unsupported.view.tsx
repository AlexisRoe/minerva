import { BrandLogo, NoContentView, ReportButtonPage } from '@minerva/ui-lib';
import { useSearchParams } from 'react-router';

import { LOGO_SIZE } from '../../constants/icon-sizes.constants';
import { ErrorScreenKind, lookupErrorPolicy } from '../../errors';
import { useTranslations } from '../../i18n';
import { REASON_PARAM } from '../../routing';

/**
 * The screen for a pane that cannot run where it has been opened.
 *
 * Reached by a redirect from the start-up loader, never by a thrown error --
 * which is the whole point of it existing separately from {@link ErrorView}.
 * Nothing has broken: the pane is outside Outlook, or on a client too old for
 * the requirement set, or Office.js could not be fetched. None of that is worth
 * a retry button, so this screen offers none -- and `NoContentView` carries no
 * button by design, which is why the registry marks these failures `canRetry:
 * false`.
 *
 * The reason travels in the query string as an error code, because a redirect
 * cannot carry anything else and the loader's `MinervaError` does not survive
 * it. What that code *means* is read back from the error registry, so this
 * screen and the loader that sent the user here cannot disagree; a code with no
 * entry falls back to the generic line rather than a blank pane.
 *
 * @see {@link ../../errors/errors.registry.ts} -- where the message is declared
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
  const { screen, message } = lookupErrorPolicy(reason);

  const isNoContent = screen === ErrorScreenKind.NoContent;
  const description = isNoContent ? t(message) : t('unsupported-generic');

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>
      <ReportButtonPage.Content>
        <NoContentView description={description} title={t('unsupported-title')} />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}
