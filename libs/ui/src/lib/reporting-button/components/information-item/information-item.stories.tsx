import type { Meta, StoryObj } from '@storybook/react-vite';
import { InformationItem } from './information-item';

const meta = {
  title: 'Reporting Button/Components/InformationItem',
  component: InformationItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof InformationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Name',
    value: 'Jamie Keller',
  },
  render: (args) => <InformationItem {...args} className="w-96" />,
};

/** Long values, e.g. an internal ID, wrap rather than overflowing their container. */
export const LongValue: Story = {
  args: {
    label: 'Internal ID',
    value: '3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31',
  },
  render: (args) => <InformationItem {...args} className="w-96" />,
};
