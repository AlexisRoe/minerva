import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

const meta = {
  title: 'General/Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
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

export const Destructive: Story = {
  args: {
    children: 'Delete report',
    variant: 'destructive',
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

export const Secondary: Story = {
  args: {
    children: 'Send report',
    variant: 'secondary',
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

export const Link: Story = {
  args: {
    children: 'Send report',
    variant: 'link',
    size: 'default',
  },
};
