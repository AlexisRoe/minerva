import { Box, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { BrandLogo } from '../../../primitives/brand-logo/brand-logo.component';
import { ButtonDrawer } from '../button-drawer/button-drawer.component';
import { ButtonInfoContent, type ButtonInfoContentProps } from '../button-info-content/button-info-content.component';
import { PageDescription } from '../page-description/page-description.component';
import { ReportButton, type ReportButtonVariant } from '../report-button/report-button.component';
import { ReportButtonList } from '../report-button-list/report-button-list.component';
import { ReportButtonPage } from '../report-button-page/report-button-page.component';
import { SateliteButton } from '../satelite-button/satelite-button.component';
import { type ReportingReason, UserFeedback, type UserFeedbackValue } from '../user-feedback/user-feedback.component';

const mockSateliteData: ButtonInfoContentProps['sections'] = [
  {
    title: 'User',
    entries: [
      {
        label: 'name',
        value: 'Jamie Keller',
      },
      {
        label: 'Email',
        value: 'jamie.keller@contoso.com',
      },
      {
        label: 'Internal ID',
        value: '3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31',
      },
    ],
  },
  {
    title: 'Email',
    entries: [
      {
        label: 'Exchange ID',
        value: 'AAMkAGI2...TAAA=',
      },
      {
        label: 'Subject',
        value: 'Urgent: Verify your account',
      },
      {
        label: 'From',
        value: 'it-support@contoso-security.net',
      },
      {
        label: 'To',
        value: 'jamie.keller@contoso.com',
      },
      {
        label: 'Received',
        value: 'Jul 23, 2026, 09:14',
      },
    ],
  },
  {
    title: 'Environment',
    entries: [
      {
        label: 'Host',
        value: 'Outlook',
      },
      {
        label: 'Platform',
        value: 'OfficeOnline',
      },
      {
        label: 'Client mode',
        value: 'ReadOnly',
      },
      {
        label: 'Outlook build',
        value: '16.0.17726.20000',
      },
      {
        label: 'Office.js version',
        value: '1.1.104119.0',
      },
      {
        label: 'Browser / UA',
        value: 'Chrome 126 · Windows 10',
      },
      {
        label: 'Add-in version',
        value: 'Minerva 2.4.1',
      },
      {
        label: 'Locale / Timezone',
        value: 'en-US · UTC+1',
      },
    ],
  },
];

/** What can be said about a suspicious mail, and what a report of one has to carry. */
const suspiciousReasons: ReportingReason[] = [
  { value: 'sender', label: 'The sender is not who they claim to be' },
  { value: 'links', label: 'It asks me to follow a link' },
  { value: 'credentials', label: 'It asks for a password or a code' },
  { value: 'attachment', label: 'It came with an attachment I did not expect' },
  { value: 'other', label: 'Something else about it looks wrong' },
];

/**
 * Spam is reported for what it is, so nothing has to be picked — the note is
 * there for whoever wants to add something, and the report goes either way.
 */
const spamReasons: ReportingReason[] = [];

/** What each report asks for once its button has been pressed. */
const reportForms: Record<ReportButtonVariant, { title: string; reasons: ReportingReason[]; isMandatory: boolean }> = {
  suspicious: {
    title: 'Report as suspicious',
    reasons: suspiciousReasons,
    isMandatory: true,
  },
  spam: {
    title: 'Report as spam',
    reasons: spamReasons,
    isMandatory: false,
  },
};

/** The mark is sized for a pane that can be as narrow as 220px. */
const logoSize = 28;

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  // The content row of the page is what has the height; this keeps it from growing past it.
  minHeight: 0,
} as const;

/** The list takes what the description leaves, which is what lets the buttons grow. */
const listStyle = {
  flex: '1 1 auto',
  minHeight: 0,
} as const;

export interface ReportPageProps {
  /** Called with the report that was filed, and everything the drawer collected for it. */
  onReport?: (variant: ReportButtonVariant, feedback: UserFeedbackValue) => void;
}

/**
 * @description The taskpane view: the brand logo in the header, then the page
 * description above the two report buttons. It fills the height it is given, so
 * the buttons share out whatever is left under the description.
 *
 * Pressing a report button does not file the report — it opens the drawer that
 * asks what is wrong with the mail, and the report goes from there. The page
 * holds two pieces of state for that: which report is being filed, and the one
 * value the feedback block hands back. The second is what the report button in
 * the footer is hung on, so a report that is missing a mandatory reason cannot
 * be sent. Both are dropped when the drawer closes, so the next one opens blank.
 *
 * A story fixture standing in for the real page — it is not exported from the
 * library.
 *
 * @example
 * ```tsx
 * <ReportPage onReport={(variant, feedback) => console.log(variant, feedback)} />
 * ```
 */
export function ReportPage({ onReport }: ReportPageProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [filing, setFiling] = useState<ReportButtonVariant | null>(null);
  const [feedback, setFeedback] = useState<UserFeedbackValue | null>(null);

  const form = filing ? reportForms[filing] : null;

  function startReport(variant: ReportButtonVariant) {
    setFiling(variant);
  }

  function cancelReport() {
    setFiling(null);
    setFeedback(null);
  }

  function sendReport() {
    if (!filing || !feedback) return;

    onReport?.(filing, feedback);
    cancelReport();
  }

  const CloseButton = (
    <Button variant="outline" onClick={close}>
      Close
    </Button>
  );

  return (
    <Box ref={setContainer} pos="relative" h="100%" style={{ overflow: 'hidden' }}>
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <BrandLogo size={logoSize} />
          <SateliteButton onClick={open} />
        </ReportButtonPage.Header>

        <ReportButtonPage.Content style={contentStyle}>
          <PageDescription
            title="Report this mail"
            description="Tell us what is wrong with the message you have open."
          />

          <ReportButtonList style={listStyle}>
            <ReportButton
              variant="suspicious"
              title="Suspicious"
              description="Something about this message looks off."
              onReport={startReport}
            />

            <ReportButton
              variant="spam"
              title="Spam"
              description="Bulk mail nobody asked for."
              onReport={startReport}
            />
          </ReportButtonList>
        </ReportButtonPage.Content>

        <ButtonDrawer title="Details" container={container} opened={opened} onClose={close} footer={CloseButton}>
          <ButtonInfoContent sections={mockSateliteData} />
        </ButtonDrawer>

        <ButtonDrawer
          title={form?.title}
          container={container}
          opened={form !== null}
          onClose={cancelReport}
          footer={
            <>
              <Button disabled={!feedback?.isValid} onClick={sendReport}>
                Send the report
              </Button>

              <Button variant="outline" onClick={cancelReport}>
                Cancel
              </Button>
            </>
          }
        >
          {form && (
            <UserFeedback
              reasons={form.reasons}
              isMandatory={form.isMandatory}
              reasonsLabel="What is wrong with it?"
              mandatoryError="Pick at least one reason."
              hasUserInput
              inputLabel="Anything else we should know?"
              inputPlaceholder="Anything that would help someone reading this later"
              onChange={setFeedback}
            />
          )}
        </ButtonDrawer>
      </ReportButtonPage>
    </Box>
  );
}

ReportPage.displayName = 'ReportPage';
