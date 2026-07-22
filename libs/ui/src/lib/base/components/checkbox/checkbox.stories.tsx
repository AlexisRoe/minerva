import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './checkbox';

const meta = {
  title: 'General/Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': 'Accept terms' },
};

export const Checked: Story = {
  args: { 'aria-label': 'Accept terms', defaultChecked: true },
};

export const Disabled: Story = {
  args: { 'aria-label': 'Accept terms', disabled: true },
};
