import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconMail, IconRefresh, IconTrash } from '@tabler/icons-react';

import { ActionButton } from './action-button.example';

const meta = {
  title: 'Styled/Components/ActionButton',
  component: ActionButton,
  tags: ['autodocs'],
  args: {
    label: 'Process inbox',
  },
} satisfies Meta<typeof ActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: { label: 'Refresh', icon: IconRefresh },
};

export const Destructive: Story = {
  args: { label: 'Delete', icon: IconTrash, color: 'red', variant: 'light' },
};

export const Sizes: Story = {
  args: { label: 'Send', icon: IconMail, size: 'lg' },
};
