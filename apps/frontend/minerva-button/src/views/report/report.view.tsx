import {
  BrandLogo,
  ButtonDrawer,
  ButtonInfoContent,
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
import { buildSections } from './build-sections-for-satelite-drawer.util';

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
  const sections = buildSections(t, { message, user, environment });

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
        <FeatureGuard feature={canShowDetails}>
          <SateliteButton label={t('details.open')} onClick={details.open} />
        </FeatureGuard>
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <FeatureGuard feature={showMessage}>
          <PageDescription description={t('report.description')} title={t('report.title')} />
          <ReportButtonList>
            <ReportButton
              description={t('report.variant.suspicious.description')}
              onReport={startReport}
              title={t('report.variant.suspicious.title')}
              variant="suspicious"
            />
            <FeatureGuard feature={canReportSpam}>
              <ReportButton
                description={t('report.variant.spam.description')}
                onReport={startReport}
                title={t('report.variant.spam.title')}
                variant="spam"
              />
            </FeatureGuard>
          </ReportButtonList>
        </FeatureGuard>

        <FeatureGuard feature={!showMessage}>
          <NoContentView description={t('report.empty.description')} title={t('report.empty.title')} />
        </FeatureGuard>
      </ReportButtonPage.Content>

      <FeatureGuard feature={canShowDetails}>
        <ButtonDrawer
          footer={
            <Button onClick={details.close} variant="outline">
              {t('general.close')}
            </Button>
          }
          onClose={details.close}
          opened={detailsOpened}
          title={t('details.title')}
        >
          <ButtonInfoContent sections={sections} />
        </ButtonDrawer>
      </FeatureGuard>

      <ButtonDrawer
        footer={
          <>
            <Button disabled={!canSend} onClick={sendReport}>
              {t('report.submit')}
            </Button>
            <Button onClick={cancelReport} variant="outline">
              {t('general.cancel')}
            </Button>
          </>
        }
        onClose={cancelReport}
        opened={filing !== null}
        title={filing === 'spam' ? t('report.variant.spam.drawer-title') : t('report.variant.suspicious.drawer-title')}
      >
        <FeatureGuard feature={filing !== null}>
          <UserFeedback
            hasUserInput={hasFreetextField}
            inputLabel={t('report.comment.label')}
            inputPlaceholder={t('report.comment.placeholder')}
            isMandatory={isReasonMandatory}
            mandatoryError={t('report.reasons.mandatory-error')}
            onChange={setFeedback}
            reasons={reasons}
            reasonsLabel={t('report.reasons.label')}
          />
        </FeatureGuard>
      </ButtonDrawer>
    </ReportButtonPage>
  );
}
