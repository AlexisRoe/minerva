import type { EmailType } from '@minerva/typescript-lib';
import { BrandLogo, ConfirmationView as ConfirmationPanel, ReportButtonPage } from '@minerva/ui-lib';
import { Anchor, Button, Stack, Text, Title } from '@minerva/ui-lib/primitives';
import { useState } from 'react';
import { useActionData } from 'react-router';
import type { WellKnownFolder } from '../../adapters/graph';
import { closePane } from '../../adapters/office';
import { FeatureGuard } from '../../components';
import { useConfig } from '../../config';
import { LOGO_SIZE } from '../../constants/icon-sizes.constants';
import { type TranslationKey, useTranslations } from '../../i18n';
import type { ReportResult } from '../../reporting';
import { createPaneAdapters } from '../../routing';
import { captureError } from '../../sentry';
import { type ReportVariant, useOffice, useSettings } from '../../store';

/**
 * Where each report sends the mail, and what the button offering it says.
 *
 * Suspicious mail is deleted and spam is filed under junk, which is what the
 * two reports mean to a mailbox: one is a threat to be rid of, the other is
 * noise to be trained on. Both names are Graph's well-known folders, which is
 * the only form that works for every user without a lookup.
 */
const DISPOSITION = {
  suspicious: { folder: 'deleteditems', labelKey: 'footer-delete' },
  spam: { folder: 'junkemail', labelKey: 'footer-spam' },
} as const satisfies Record<ReportVariant, { folder: WellKnownFolder; labelKey: TranslationKey }>;

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
 * The footer is the last thing the pane does: move the mail out of the inbox and
 * close. That is deliberately *after* the report rather than part of it. Moving
 * first would leave a user who hit a Graph failure with a mail that had
 * vanished and no report filed.
 *
 * @see {@link https://reactrouter.com/api/hooks/useActionData}
 *
 * @example
 * ```tsx
 * { path: ROUTES.confirmation, Component: ConfirmationView, action: createReportAction(config) }
 * ```
 */
export function ConfirmationView() {
  const { t } = useTranslations();
  const config = useConfig();
  // `undefined` when the route was reached without an action having run, `null`
  // when one ran and returned nothing. Neither is a report, so they collapse.
  const result = (useActionData() as ReportResult | null | undefined) ?? undefined;
  const { environment, message } = useOffice();
  const { hasContact, contact } = useSettings();

  const [isMoving, setIsMoving] = useState(false);
  const [moveFailed, setMoveFailed] = useState(false);

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
      </ReportButtonPage>
    );
  }

  const { response, reportedAs, outcomes } = result;
  const { folder, labelKey } = DISPOSITION[reportedAs];

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

  async function dispose(): Promise<void> {
    if (environment === null || message === null) {
      return;
    }

    setIsMoving(true);
    setMoveFailed(false);

    try {
      const { graph } = createPaneAdapters(config, environment);

      await graph.moveMessage(message.exchangeId, folder);
      closePane();
    } catch (error) {
      // The report is already filed, so this is not a failed report -- only a
      // mail still sitting in the inbox. Saying so beats closing the pane and
      // letting the user believe it had gone.
      captureError(error);
      setMoveFailed(true);
      setIsMoving(false);
    }
  }

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
        <Button loading={isMoving} onClick={() => void dispose()}>
          {t(labelKey)}
        </Button>
      </ReportButtonPage.Footer>
    </ReportButtonPage>
  );
}
