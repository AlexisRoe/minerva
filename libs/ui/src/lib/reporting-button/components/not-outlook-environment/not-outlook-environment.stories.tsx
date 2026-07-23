import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotOutlookEnvironment } from './not-outlook-environment';

const meta = {
  title: 'Reporting Button/Components/NotOutlookEnvironment',
  component: NotOutlookEnvironment,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NotOutlookEnvironment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Not running in Outlook',
    description: 'Open this add-in from within Outlook to submit a report.',
  },
  render: (args) => <NotOutlookEnvironment {...args} className="w-96 border" />,
};
