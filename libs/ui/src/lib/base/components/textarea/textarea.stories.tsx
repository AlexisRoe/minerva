import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './textarea';

const meta = {
  title: 'General/Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Add any details that might help (optional)' },
  render: (args) => <Textarea {...args} className="w-96" />,
};

export const Disabled: Story = {
  args: { placeholder: 'Add any details that might help (optional)', disabled: true },
  render: (args) => <Textarea {...args} className="w-96" />,
};
