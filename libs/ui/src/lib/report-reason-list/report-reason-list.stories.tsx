import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReportReason, ReportReasonList } from './report-reason-list';

const suspiciousReasons: ReportReason[] = [
  { id: 'suspicious-link', label: 'Suspicious link or website' },
  { id: 'unusual-attachment', label: 'Unexpected or unusual attachment' },
  { id: 'impersonation', label: 'Impersonates a person or company' },
  { id: 'credentials-request', label: 'Asks for credentials, payment or personal info' },
  { id: 'urgency', label: 'Creates urgency or pressure to act fast' },
  { id: 'other', label: 'Something else feels wrong' },
];

const meta = {
  title: 'Reporting Button/Components/ReportReasonList',
  component: ReportReasonList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ReportReasonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { reasons: suspiciousReasons, defaultValue: [] },
  render: (args) => <ReportReasonList {...args} className="w-96" />,
};

export const WithPreselectedReasons: Story = {
  args: { reasons: suspiciousReasons, defaultValue: ['suspicious-link', 'urgency'] },
  render: (args) => <ReportReasonList {...args} className="w-96" />,
};
