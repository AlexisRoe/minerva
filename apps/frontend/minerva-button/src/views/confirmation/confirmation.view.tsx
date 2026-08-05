import type { EmailType } from '@minerva/typescript-lib';
import { BrandLogo, ConfirmationView as ConfirmationPanel, ReportButtonPage } from '@minerva/ui-lib';
import { Anchor, Button, Stack, Text, Title } from '@minerva/ui-lib/primitives';
import type { ReactElement } from 'react';
import { useAsyncData } from '@/components/async-loading/async-loading.component';
import { FeatureGuard } from '@/components/feature-guard/feature-guard.component';
import { LOGO_SIZE } from '@/constants/icon-sizes.constants';
import type { ReportResult } from '@/domain/reporting/reporting.types';
import { useMessageDisposition } from '@/hooks/use-message-disposition.hook';
import { useTranslations } from '@/platform/i18n/hooks/use-translations.hook';
import type { TranslationKey } from '@/platform/i18n/utils/translate.util';
import { useSettings } from '@/stores/session/hooks/use-settings.hook';

/** What is said about an email the backend recognised. */
const IDENTIFIED_KEYS = {
  system: 'identified-system',
  simulation: 'identified-simulation',
  unknown: 'identified-unknown',
} as const satisfies Record<EmailType, TranslationKey>;

/**
 * The pane once a report has gone.
 *
 * It reads what the reporting loader wrapped around it resolved with, which is
 * the whole reason that loader is mounted on this route rather than the one
 * before it: the per-method outcomes exist nowhere else, and a navigation could
 * not have carried them.
 *
 * What it says is keyed on two things the user cannot see for themselves --
 * which report they filed, and what the backend recognised the mail as. A
 * simulation and a real threat both need saying out loud, and they need saying
 * differently; an unrecognised mail gets the neutral line rather than a claim
 * nobody has checked.
 *
 * The footer offers the two ways out: leave the mail where it is and close, or
 * file it away first. What either means to the mailbox belongs to
 * {@link useMessageDisposition}; this file only draws the buttons.
 *
 * @example
 * ```tsx
 * <AsyncLoading loader={reportLoader} type="report"><ConfirmationView /></AsyncLoading>
 * ```
 */
export function ConfirmationView(): ReactElement {
  const { t } = useTranslations();
  const result = useAsyncData<ReportResult | undefined>();
  const { hasContact, contact } = useSettings();

  const isReportedAs = result?.reportedAs ?? 'suspicious';
  const { labelKey, isMoving, moveFailed, dispose, dismiss } = useMessageDisposition(isReportedAs);

  // Reached directly rather than through a report -- a reload, or the pane being
  // reopened. There is nothing to confirm, so it says the neutral thing.
  if (result === undefined) {
    return (
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <BrandLogo size={LOGO_SIZE} />
        </ReportButtonPage.Header>
        <ReportButtonPage.Content>
          <ConfirmationPanel description={t('confirmation-body')} title={t('confirmation-title')} />
        </ReportButtonPage.Content>
        <ReportButtonPage.Footer>
          <Button onClick={dismiss} variant="outline">
            {t('close')}
          </Button>
        </ReportButtonPage.Footer>
      </ReportButtonPage>
    );
  }

  const { response, reportedAs, outcomes } = result;

  // Both halves have to agree before a claim is made. `isIdentified` is what says
  // the backend recognised anything at all, so a payload that leaves it false
  // while naming a kind must not be reported as a simulation or a known threat --
  // telling someone a real phishing mail was "only a test" is the one mistake
  // this screen must never make.
  const identified =
    response.isIdentified && response.identifiedAs !== 'unknown'
      ? IDENTIFIED_KEYS[response.identifiedAs]
      : IDENTIFIED_KEYS.unknown;

  const details = [
    t('detail-report-id', { id: response.reportId }),
    ...outcomes.map((outcome) =>
      outcome.delivered
        ? t('notified-ok', { address: outcome.address })
        : t('notified-failed', { address: outcome.address }),
    ),
  ];

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <ConfirmationPanel
          description={t(reportedAs === 'spam' ? 'confirmation-spam-body' : 'confirmation-suspicious-body')}
          details={details}
          detailsTitle={t('notified-title')}
          statusMessage={t(identified)}
          title={t(reportedAs === 'spam' ? 'confirmation-spam-title' : 'confirmation-suspicious-title')}
        />

        <FeatureGuard feature={hasContact}>
          <Stack gap="xs">
            <Title order={2} size="h5">
              {t('contact-title')}
            </Title>

            <FeatureGuard feature={Boolean(contact?.contactPerson)}>
              <Text size="sm">{contact?.contactPerson}</Text>
            </FeatureGuard>

            <FeatureGuard feature={Boolean(contact?.emailAdress)}>
              <Anchor href={`mailto:${contact?.emailAdress}`} size="sm">
                {contact?.emailAdress}
              </Anchor>
            </FeatureGuard>

            <FeatureGuard feature={Boolean(contact?.informationUrl)}>
              <Anchor href={contact?.informationUrl} rel="noreferrer" size="sm" target="_blank">
                {t('contact-more')}
              </Anchor>
            </FeatureGuard>
          </Stack>
        </FeatureGuard>

        <FeatureGuard feature={moveFailed}>
          <Text c="red" size="sm">
            {t('move-failed')}
          </Text>
        </FeatureGuard>
      </ReportButtonPage.Content>

      <ReportButtonPage.Footer>
        <Button loading={isMoving} onClick={dispose}>
          {t(labelKey)}
        </Button>
        <Button disabled={isMoving} onClick={dismiss} variant="outline">
          {t('close')}
        </Button>
      </ReportButtonPage.Footer>
    </ReportButtonPage>
  );
}
