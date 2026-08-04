import type { EmailType } from '@minerva/typescript-lib';
import { BrandLogo, ConfirmationView as ConfirmationPanel, ReportButtonPage } from '@minerva/ui-lib';
import { Anchor, Button, Stack, Text, Title } from '@minerva/ui-lib/primitives';
import type { ReactElement } from 'react';
import { useActionData } from 'react-router';
import { FeatureGuard } from '@/components/feature-guard/feature-guard.component';
import { LOGO_SIZE } from '@/constants/icon-sizes.constants';
import type { ReportResult } from '@/domain/reporting/reporting.types';
import { useMessageDisposition } from '@/hooks/use-message-disposition.hook';
import { useTranslations } from '@/platform/i18n/hooks/use-translations.hook';
import type { TranslationKey } from '@/platform/i18n/utils/translate.util';
import { useSettings } from '@/stores/settings/hooks/use-settings.hook';

/** What is said about an email the backend recognised. */
const IDENTIFIED_KEYS = {
  system: 'identified-system',
  simulation: 'identified-simulation',
  unknown: 'identified-unknown',
} as const satisfies Record<EmailType, TranslationKey>;

/**
 * The pane once a report has gone.
 *
 * It reads the reporting action's return value rather than a loader's, which is
 * the whole reason the action is mounted on this route: the per-method outcomes
 * exist nowhere else, and a redirect could not have carried them.
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
 * @see {@link https://reactrouter.com/api/hooks/useActionData}
 *
 * @example
 * ```tsx
 * { path: ROUTES.confirmation, Component: ConfirmationView, action: createReportAction(config) }
 * ```
 */
export function ConfirmationView(): ReactElement {
  const { t } = useTranslations();
  // `undefined` when the route was reached without an action having run, `null`
  // when one ran and returned nothing. Neither is a report, so they collapse.
  const result = (useActionData() as ReportResult | null | undefined) ?? undefined;
  const { hasContact, contact } = useSettings();

  // Called before the neutral screen returns, because hooks cannot be
  // conditional. The fallback is never read: nothing offers to move a mail on a
  // screen that has no report to show.
  const { labelKey, isMoving, moveFailed, dispose, dismiss } = useMessageDisposition(
    result?.reportedAs ?? 'suspicious',
  );

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

        {/* Only the way out: there is no report here, so there is nothing this
            screen could claim to know about where the mail should go. */}
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
        {/* Leaving is the safe move, so it is the one that is not emphasised --
            the mail stays where it is and the report is already filed. */}
        <Button disabled={isMoving} onClick={dismiss} variant="outline">
          {t('close')}
        </Button>
        <Button loading={isMoving} onClick={dispose}>
          {t(labelKey)}
        </Button>
      </ReportButtonPage.Footer>
    </ReportButtonPage>
  );
}
