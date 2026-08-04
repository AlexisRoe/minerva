import { MinervaError } from '@minerva/typescript-lib';
import { BrandLogo, ErrorView as ErrorPanel, ReportButtonPage } from '@minerva/ui-lib';

import { MAX_RETRY, RETRY_PARAM, useConfig } from '../../config';
import { LOGO_SIZE } from '../../constants/icon-sizes.constants';
import { lookupErrorPolicy } from '../../errors';
import { useTranslations } from '../../i18n';

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
 * @see {@link ../../errors/errors.registry.ts} -- where the policy lives
 *
 * @example
 * ```tsx
 * <ErrorScreen error={error} errorId={eventId} />
 * ```
 */
export function ErrorScreen({ error, errorId }: ErrorScreenProps) {
  const { t } = useTranslations();
  const config = useConfig();

  const isMinerva = MinervaError.is(error);
  const policy = isMinerva ? lookupErrorPolicy(error.code) : undefined;

  // An unrecognised error is worth one attempt: it may well be a transient thing
  // nobody has classified yet, and there is nothing else to offer.
  const canRetry = (policy?.canRetry ?? true) && config.retry < MAX_RETRY;

  function retry(): void {
    const url = new URL(globalThis.location.href);
    url.searchParams.set(RETRY_PARAM, String(config.retry + 1));

    globalThis.location.assign(url.toString());
  }

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <ErrorPanel
          buttonAction={canRetry ? retry : undefined}
          buttonLabel={canRetry ? t('retry') : undefined}
          description={policy === undefined ? t('error') : t(policy.message)}
          errorCode={isMinerva ? error.code : undefined}
          errorId={errorId}
          title={t('error-title')}
        />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}
