import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

const meta = {
  title: 'Reporting Button/Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    size: { control: 'select', options: ['default', 'sm', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Send report',
    variant: 'default',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Send report',
    variant: 'outline',
    size: 'default',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Send report',
    variant: 'ghost',
    size: 'default',
  },
};
