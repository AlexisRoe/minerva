import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { CardGroup } from '../../base/components/card/card';
import { ButtonPage } from '../components/button-page/button-page';
import { InformationItem } from '../components/information-item/information-item';
import { InformationSection } from '../components/information-section/information-section';
import { MailClassificationCard } from '../components/mail-classification-card/mail-classification-card';
import type { ReportReason } from '../components/report-reason-list/report-reason-list';
import { ReportingFeedbackDrawer } from '../components/reporting-feedback-drawer/reporting-feedback-drawer';
import { SatelliteDrawer } from '../components/satellite-drawer/satellite-drawer';
import { SectionHeader } from '../components/section-header/section-header';

/**
 * Storybook-only wrapper that frames `ButtonPage` the way it actually appears
 * in production: a fixed-size widget (380x820) with a white background,
 * centered on a light grey page. `ButtonPage` itself renders `fixed inset-0`,
 * so `contain: layout` on the frame is required to make it the containing
 * block for `ButtonPage`'s fixed positioning instead of the browser viewport.
 */
function WidgetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-200">
      <div className="relative h-[820px] w-[380px] overflow-hidden bg-white [contain:layout]">{children}</div>
    </div>
  );
}

const suspiciousReasons: ReportReason[] = [
  { id: 'suspicious-link', label: 'Suspicious link or website' },
  { id: 'unusual-attachment', label: 'Unexpected or unusual attachment' },
  { id: 'impersonation', label: 'Impersonates a person or company' },
  { id: 'credentials-request', label: 'Asks for credentials, payment or personal info' },
  { id: 'urgency', label: 'Creates urgency or pressure to act fast' },
  { id: 'other', label: 'Something else feels wrong' },
];

const spamReasons: ReportReason[] = [
  { id: 'unsolicited', label: 'Unsolicited advertising or promotion' },
  { id: 'repeated', label: 'Sent repeatedly from the same sender' },
  { id: 'irrelevant', label: 'Not relevant to me or my role' },
];

const meta = {
  title: 'Reporting Button/Views/ReportPage',
  component: ButtonPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
} satisfies Meta<typeof ButtonPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ButtonPage rendered fullscreen, with ButtonPage.Content showing the report-selection
 * screen — a SectionHeader above two MailClassificationCards. Each whole card is the trigger
 * for a ReportingFeedbackDrawer (Suspicious or Spam) that collects a reason before submitting;
 * submit just logs the collected values to the console.
 */
export const ReportPage: Story = {
  render: () => (
    <ButtonPage>
      <ButtonPage.Header
        right={
          <SatelliteDrawer triggerLabel="Close" primaryButtonText="Close">
            <InformationSection title="User">
              <InformationItem label="Name" value="Jamie Keller" />
              <InformationItem label="Email" value="jamie.keller@contoso.com" />
              <InformationItem label="Internal ID" value="3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31" />
            </InformationSection>
            <InformationSection title="Email">
              <InformationItem label="Exchange ID" value="AAMkAGI2...TAAA=" />
              <InformationItem label="Subject" value="Urgent: Verify your account" />
              <InformationItem label="From" value="it-support@contoso-security.net" />
              <InformationItem label="To" value="jamie.keller@contoso.com" />
              <InformationItem label="Received" value="Jul 23, 2026, 09:14" />
            </InformationSection>
            <InformationSection title="Environment">
              <InformationItem label="Host" value="Outlook" />
              <InformationItem label="Platform" value="OfficeOnline" />
              <InformationItem label="Client mode" value="ReadOnly" />
              <InformationItem label="Outlook build" value="16.0.17726.20000" />
              <InformationItem label="Office.js version" value="1.1.104119.0" />
              <InformationItem label="Browser / UA" value="Chrome 126 · Windows 10" />
              <InformationItem label="Add-in version" value="Minerva 2.4.1" />
              <InformationItem label="Locale / Timezone" value="en-US · UTC+1" />
            </InformationSection>
          </SatelliteDrawer>
        }
      />
      <ButtonPage.Content>
        <SectionHeader
          title="Report this email"
          description="Help keep your organization safe. Choose the option that best matches this message — we'll take it from there."
          className="mb-8"
        />
        <CardGroup className="flex-1">
          <ReportingFeedbackDrawer
            type="suspicious"
            title="What makes this suspicious?"
            reasons={suspiciousReasons}
            textareaPlaceholder="Add any details that might help (optional)"
            primaryButtonText="Report as Suspicious"
            outlineButtonText="Cancel"
            onPrimaryAction={(values) => console.log('Report submitted', values)}
            trigger={
              <MailClassificationCard
                variant="suspicious"
                title="Suspicious"
                description="Phishing attempt, impersonation, malicious link or attachment"
                className="flex-1 cursor-pointer"
              />
            }
          />
          <ReportingFeedbackDrawer
            type="spam"
            title="What makes this spam?"
            reasons={spamReasons}
            textareaPlaceholder="Add any details that might help (optional)"
            primaryButtonText="Report as Spam"
            outlineButtonText="Cancel"
            onPrimaryAction={(values) => console.log('Report submitted', values)}
            trigger={
              <MailClassificationCard
                variant="spam"
                title="Spam"
                description="Unwanted marketing or junk mail"
                className="flex-1 cursor-pointer"
              />
            }
          />
        </CardGroup>
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
