import { MinervaError } from '@minerva/typescript-lib';
import { BrandLogo, ErrorView as ErrorPanel, NoContentView, ReportButtonPage } from '@minerva/ui-lib';
import type { ReactElement } from 'react';
import { MAX_RETRY, RETRY_PARAM } from '@/constants/config.constants';
import { LOGO_SIZE } from '@/constants/icon-sizes.constants';
import { lookupErrorPolicy } from '@/domain/errors/errors.registry';
import { ErrorScreenKind } from '@/domain/errors/errors.types';
import { useConfig } from '@/platform/config/hooks/use-config.hook';
import { useTranslations } from '@/platform/i18n/hooks/use-translations.hook';

/** What {@link ErrorScreen} needs. */
export interface ErrorScreenProps {
  /** Whatever was thrown -- a {@link MinervaError}, or anything else. */
  error: unknown;
  /**
   * Sentry's event id for this occurrence, once it has been reported.
   *
   * This, and not the error's `reference`, is what a user should be given to
   * quote: the reference names the throw site and is identical for every
   * occurrence, so it groups reports but cannot pick one out. Absent while the
   * report is still in flight, or when Sentry is switched off.
   */
  errorId?: string | undefined;
}

/**
 * The pane after something has failed, said as usefully as the error allows.
 *
 * The branch is the point of this component. A {@link MinervaError} carries a
 * `code`, which the registry turns into three answers at once: what to tell the
 * user, whether a retry is worth offering, and -- upstream of here -- which
 * screen they should have landed on. Anything else is by definition
 * unrecognised, so it gets the generic line and no code: showing one would
 * invite someone to look up a reference that appears in no registry.
 *
 * Retry is offered only when the registry says the failure is worth retrying
 * *and* the budget allows it. `loadConfig` clamps `retry` to {@link MAX_RETRY},
 * so a second failure renders no button rather than one that cannot help.
 * Retrying reloads rather than re-rendering: the point is to redo the start-up
 * sequence, which happens above React.
 *
 * Not every failure is a fault. The registry marks three of them
 * {@link ErrorScreenKind.NoContent} -- the pane is outside Outlook, on a client
 * too old for the requirement set, or Office.js never arrived -- and those get
 * the no-content screen instead: nothing has broken, the pane is simply
 * somewhere it does not work, and a stack reference and a retry button would
 * both be the wrong response. That branch is what used to be a separate
 * `/unsupported` route reached by a redirect; keeping it here is what stops the
 * two screens from ever disagreeing about which failures are environmental.
 *
 * It is rendered below {@link ConfigProvider} -- as {@link MinervaErrorBoundary}'s
 * fallback, mounted inside the providers precisely so that this screen can count
 * on a theme, a translator and a budget. {@link useConfig} therefore throws
 * off-provider as it does everywhere else: a failure screen with no
 * configuration behind it is a wiring mistake, not a state to render. What
 * happens above the providers is {@link RootErrorBoundary}'s problem, and it
 * does not render components at all.
 *
 * @see {@link ../../errors/errors.registry.ts} -- where the policy lives
 *
 * @example
 * ```tsx
 * <ErrorScreen error={error} errorId={eventId} />
 * ```
 */
export function ErrorScreen({ error, errorId }: ErrorScreenProps): ReactElement {
  const { t } = useTranslations();
  const config = useConfig();

  const isMinerva = MinervaError.is(error);
  const policy = lookupErrorPolicy(isMinerva ? error.code : null);

  const canRetry = (policy?.canRetry ?? true) && config.retry < MAX_RETRY;

  function retry(): void {
    const url = new URL(globalThis.location.href);
    url.searchParams.set(RETRY_PARAM, String(config.retry + 1));

    globalThis.location.assign(url.toString());
  }

  if (policy?.screen === ErrorScreenKind.NoContent) {
    return (
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <BrandLogo size={LOGO_SIZE} />
        </ReportButtonPage.Header>

        <ReportButtonPage.Content>
          <NoContentView description={t(policy.message)} title={t('errors.unsupported.title')} />
        </ReportButtonPage.Content>
      </ReportButtonPage>
    );
  }

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <ErrorPanel
          buttonAction={canRetry ? retry : undefined}
          buttonLabel={canRetry ? t('general.retry') : undefined}
          description={policy === undefined ? t('errors.generic.message') : t(policy.message)}
          errorCode={isMinerva ? error.code : undefined}
          errorId={errorId}
          title={t('errors.generic.title')}
        />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}
