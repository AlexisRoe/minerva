import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportingHeader } from './reporting-header';

const meta = {
  title: 'Reporting Button/Components/ReportingHeader',
  component: ReportingHeader,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ReportingHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Suspicious: Story = {
  args: {
    variant: 'suspicious',
    title: 'What makes this suspicious?',
  },
};

export const Spam: Story = {
  args: {
    variant: 'spam',
    title: 'What makes this spam?',
  },
};
