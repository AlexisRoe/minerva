import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconSearch, IconShieldCheck } from '@tabler/icons-react';

import { ActionButton } from '../action-button/action-button.example';
import { EmptyState } from './empty-state.component';

/**
 * The block fills the height it is given, so it needs an ancestor with one. This
 * frame stands in for the panel it would sit in.
 */
const meta = {
  title: 'Styled/Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box
        h={320}
        style={{
          border: '1px dashed var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        <Story />
      </Box>
    ),
  ],
  args: {
    title: 'No reports yet',
    description: 'Anything you report from a mail shows up here.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Without a description the block tightens up to the icon and the one line. */
export const TitleOnly: Story = {
  args: { description: undefined },
};

/** The action is what the block is really for — give it the way out of the empty state. */
export const WithAction: Story = {
  args: {
    action: <ActionButton label="Report this mail" />,
  },
};

/** A search that came back with nothing reads differently from a list never filled. */
export const NoResults: Story = {
  args: {
    title: 'Nothing found',
    description: 'No mail matches what you searched for.',
    icon: IconSearch,
  },
};

/** Empty is not always a gap to fill — sometimes it is the good outcome. */
export const NothingToDo: Story = {
  args: {
    title: 'All clear',
    description: 'Nothing in this mailbox needs a look right now.',
    icon: IconShieldCheck,
  },
};

/** Everything Mantine's own `EmptyState` takes still comes through. */
export const AlignedLeft: Story = {
  args: { align: 'left' },
};
