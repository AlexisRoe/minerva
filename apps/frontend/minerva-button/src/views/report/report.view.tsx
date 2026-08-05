import {
  BrandLogo,
  ButtonDrawer,
  ButtonInfoContent,
  type ButtonInfoSection,
  NoContentView,
  PageDescription,
  ReportButton,
  ReportButtonList,
  ReportButtonPage,
  SateliteButton,
  UserFeedback,
} from '@minerva/ui-lib';
import { useDisclosure } from '@minerva/ui-lib/hooks';
import { Button } from '@minerva/ui-lib/primitives';
import type React from 'react';
import { FeatureGuard } from '@/components/feature-guard/feature-guard.component';
import { LOGO_SIZE } from '@/constants/icon-sizes.constants';
import { useReportSubmission } from '@/hooks/use-report-submission.hook';
import { useTranslations } from '@/platform/i18n/hooks/use-translations.hook';
import { useOffice } from '@/stores/session/hooks/use-office.hook';
import { useSettings } from '@/stores/session/hooks/use-settings.hook';

/** The list takes what the description leaves, which is what lets the buttons grow. */
const listStyle = { flex: '1 1 auto', minHeight: 0 } as const;

/**
 * The pane's first screen: what this message is, and the two ways to report it.
 *
 * Everything on it is the tenant's decision rather than this file's. Whether the
 * spam button exists, whether the details drawer opens, which reasons can be
 * ticked, whether one *must* be ticked, whether a note is asked for -- all of it
 * comes from `useSettings()`, which is why the boot sequence fetches the
 * settings before this renders. The strings are the translator's.
 *
 * Pressing a report button does not file anything. It opens the drawer that asks
 * what is wrong with the mail, and the report goes from there -- which is what
 * makes a mandatory reason enforceable at all, since the send button hangs on
 * the feedback block's own `isValid`.
 *
 * This file is composition only. Everything about *filing* a report -- what is
 * being filed, what the user said, whether it can be sent and what sending does
 * -- belongs to {@link useReportSubmission}, so that the rules are readable
 * without walking a render tree.
 *
 * The drawers portal to the document rather than into a container of this view's
 * own. In a real add-in the task pane *is* the window, so there is nothing to
 * stay inside -- the container prop exists for the Storybook fixture, which
 * renders the page inside a mock Outlook frame.
 *
 * @example
 * ```tsx
 * { index: true, Component: ReportView, loader: createReportLoader(config) }
 * ```
 */
export function ReportView(): React.JSX.Element {
  const { t } = useTranslations();
  const { message, user, environment, hasMessage } = useOffice();
  const { canShowDetails, canReportSpam, isReasonMandatory, hasFreetextField } = useSettings();

  const [detailsOpened, details] = useDisclosure(false);
  const { filing, reasons, canSend, startReport, setFeedback, cancelReport, sendReport } = useReportSubmission();

  const showMessage = hasMessage && message !== null;

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
        <FeatureGuard feature={canShowDetails}>
          <SateliteButton label={t('details-open')} onClick={details.open} />
        </FeatureGuard>
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <FeatureGuard feature={showMessage}>
          <PageDescription description={t('report-description')} title={t('report-title')} />
          <ReportButtonList style={listStyle}>
            <ReportButton
              description={t('report-suspicious-description')}
              onReport={startReport}
              title={t('report-suspicious-title')}
              variant="suspicious"
            />
            <FeatureGuard feature={canReportSpam}>
              <ReportButton
                description={t('report-spam-description')}
                onReport={startReport}
                title={t('report-spam-title')}
                variant="spam"
              />
            </FeatureGuard>
          </ReportButtonList>
        </FeatureGuard>

        <FeatureGuard feature={!showMessage}>
          <NoContentView description={t('no-message-description')} title={t('no-message')} />
        </FeatureGuard>
      </ReportButtonPage.Content>

      <FeatureGuard feature={canShowDetails}>
        <ButtonDrawer
          footer={
            <Button onClick={details.close} variant="outline">
              {t('close')}
            </Button>
          }
          onClose={details.close}
          opened={detailsOpened}
          title={t('details-title')}
        >
          <ButtonInfoContent sections={buildSections(t, { message, user, environment })} />
        </ButtonDrawer>
      </FeatureGuard>

      <ButtonDrawer
        footer={
          <>
            <Button disabled={!canSend} onClick={sendReport}>
              {t('send-report')}
            </Button>
            <Button onClick={cancelReport} variant="outline">
              {t('cancel')}
            </Button>
          </>
        }
        onClose={cancelReport}
        opened={filing !== null}
        title={filing === 'spam' ? t('drawer-spam-title') : t('drawer-suspicious-title')}
      >
        <FeatureGuard feature={filing !== null}>
          <UserFeedback
            hasUserInput={hasFreetextField}
            inputLabel={t('comment-label')}
            inputPlaceholder={t('comment-placeholder')}
            isMandatory={isReasonMandatory}
            mandatoryError={t('reasons-mandatory-error')}
            onChange={setFeedback}
            reasons={reasons}
            reasonsLabel={t('reasons-label')}
          />
        </FeatureGuard>
      </ButtonDrawer>
    </ReportButtonPage>
  );
}

/**
 * Builds the details drawer's blocks from what the host reported.
 *
 * A free function rather than inline JSX because it is data: the drawer renders
 * whatever sections it is handed, so this is the only place that decides what is
 * worth showing a user who is about to report something -- and what a support
 * call would want quoted back.
 */
function buildSections(
  t: ReturnType<typeof useTranslations>['t'],
  office: Pick<ReturnType<typeof useOffice>, 'message' | 'user' | 'environment'>,
): ButtonInfoSection[] {
  const { message, user, environment } = office;

  const sections: ButtonInfoSection[] = [];

  if (user !== null) {
    sections.push({
      title: t('details-user'),
      entries: [
        { label: t('detail-name'), value: user.name },
        { label: t('detail-email'), value: user.email },
      ],
    });
  }

  if (message !== null) {
    sections.push({
      title: t('details-email'),
      entries: [
        { label: t('detail-subject'), value: message.subject },
        { label: t('detail-from'), value: message.from },
        { label: t('detail-received'), value: message.receivedAt },
        { label: t('detail-exchange-id'), value: message.exchangeId },
      ],
    });
  }

  if (environment !== null) {
    sections.push({
      title: t('details-environment'),
      entries: [
        { label: t('detail-host'), value: environment.host },
        { label: t('detail-platform'), value: environment.platform },
      ],
    });
  }

  return sections;
}
