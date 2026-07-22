import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportConfirmationView } from './report-confirmation-view';

const meta = {
  title: 'Reporting Button/Components/ReportConfirmationView',
  component: ReportConfirmationView,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ReportConfirmationView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'This was a simulation',
    description:
      'This message was a phishing simulation sent by your security team to test awareness. Thanks for reporting it — no further action is needed.',
    statusMessage: 'This email has been moved to your Spam folder.',
    howToHeading: 'What to do now',
    howToItems: [
      "Don't click any links or open attachments from this sender.",
      "Don't reply to or forward the message to others.",
      'If you already interacted with it, contact the Security Team right away.',
    ],
  },
  render: (args) => <ReportConfirmationView {...args} className="w-96" />,
};
