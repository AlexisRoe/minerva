import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportConfirmationHeader } from './report-confirmation-header';

const meta = {
  title: 'Reporting Button/Components/ReportConfirmationHeader',
  component: ReportConfirmationHeader,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ReportConfirmationHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'This was a simulation',
    description:
      'This message was a phishing simulation sent by your security team to test awareness. Thanks for reporting it — no further action is needed.',
  },
  render: (args) => <ReportConfirmationHeader {...args} className="w-96" />,
};

/** Passing `statusMessage` renders a divider and a bold status line below the description. */
export const WithStatusMessage: Story = {
  args: {
    title: 'This was a simulation',
    description:
      'This message was a phishing simulation sent by your security team to test awareness. Thanks for reporting it — no further action is needed.',
    statusMessage: 'This email has been moved to your Spam folder.',
  },
  render: (args) => <ReportConfirmationHeader {...args} className="w-96" />,
};
