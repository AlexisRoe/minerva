import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconInbox } from '@tabler/icons-react';
import { Button } from '../button/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';

const meta = {
  title: 'General/Components/Empty',
  component: Empty,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconInbox />
        </EmptyMedia>
        <EmptyTitle>No reports yet</EmptyTitle>
        <EmptyDescription>Reports you submit will show up here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create report</Button>
      </EmptyContent>
    </Empty>
  ),
};
