import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { ButtonPage } from '../components/button-page/button-page';
import { ReportConfirmationView } from '../components/report-confirmation-view/report-confirmation-view';

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

const meta = {
  title: 'Reporting Button/Views/ReportConfirmationState',
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

/** ButtonPage rendered fullscreen, with ButtonPage.Content centered around a ReportConfirmationView — shown after a report has been submitted. */
export const ReportConfirmationState: Story = {
  render: () => (
    <ButtonPage>
      <ButtonPage.Header />
      <ButtonPage.Content>
        <ReportConfirmationView
          title="This was a simulation"
          description="This message was a phishing simulation sent by your security team to test awareness. Thanks for reporting it — no further action is needed."
          statusMessage="This email has been moved to your Spam folder."
          howToHeading="What to do now"
          howToItems={[
            "Don't click any links or open attachments from this sender.",
            "Don't reply to or forward the message to others.",
            'If you already interacted with it, contact the Security Team right away.',
          ]}
        />
      </ButtonPage.Content>
    </ButtonPage>
  ),
};
