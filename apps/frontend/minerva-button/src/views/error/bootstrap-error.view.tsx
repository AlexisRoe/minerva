import { BrandLogo, ErrorView as ErrorPanel, MinervaThemeProvider, ReportButtonPage } from '@minerva/ui-lib';

import { LOGO_SIZE } from '../../constants/icon-sizes.constants';
import { translate } from '../../i18n';

/**
 * The screen behind a failure that took the whole tree down with it.
 *
 * {@link MinervaErrorBoundary}'s fallback, and the last thing this app can draw.
 * It says the same things in the same frame as {@link ErrorScreen} -- the mark,
 * the panel, a title and a line of advice -- so a user meets one Minerva rather
 * than a designed screen for the failures that were anticipated and a bare
 * paragraph for the one that was not.
 *
 * It carries **no retry**, no error code and no error id, and that is the whole
 * difference from {@link ErrorScreen}. Not one of the three could be honest
 * here: the retry budget is read from a configuration this screen cannot reach,
 * a code exists only on a {@link MinervaError} and a render crash is usually not
 * one, and the Sentry event id is reported by the boundary rather than returned
 * to it. Showing an empty code or a button that reloads on no budget would be
 * worse than showing neither.
 *
 * It brings its own {@link MinervaThemeProvider} because of where it renders.
 * The boundary sits above every provider in `main.tsx` -- deliberately, so that
 * a provider throwing is still caught -- which leaves the fallback with no theme
 * on context. Without this the panel would draw unstyled at the exact moment
 * looking broken is least affordable. For the same reason the copy comes from
 * {@link translate} rather than `useTranslations`: there is no i18n provider
 * either, and the module-level instance answers regardless.
 *
 * @example
 * ```tsx
 * <MinervaErrorBoundary fallback={() => <BootstrapErrorView />}>
 * ```
 */
export function BootstrapErrorView() {
  return (
    <MinervaThemeProvider>
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <BrandLogo size={LOGO_SIZE} />
        </ReportButtonPage.Header>

        <ReportButtonPage.Content>
          <ErrorPanel description={translate('bootstrap-error-body')} title={translate('bootstrap-error-title')} />
        </ReportButtonPage.Content>
      </ReportButtonPage>
    </MinervaThemeProvider>
  );
}
