import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SimpleLoader } from './simple-loader.component';

/**
 * The loader centres itself in the room it is given, so it needs an ancestor
 * with a height. This frame stands in for the pane it would sit in.
 */
const meta = {
  title: 'Styled/Components/SimpleLoader',
  component: SimpleLoader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box h={320} bd="1px dashed var(--mantine-color-default-border)" bdrs="md">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof SimpleLoader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In the middle of the pane, at the size the docs draw it. */
export const Default: Story = {};

/** What is being waited on, where a pane can be waiting on more than one thing. */
export const WithLabel: Story = {
  args: { label: 'Loading your reports' },
};

/** Everything scales off `--loader-unit`, so half the step is half the loader. */
export const Small: Story = {
  args: { style: { '--loader-unit': '0.5px' } },
};

/** The speed is a variable as well, for a wait that wants a quicker turn. */
export const Faster: Story = {
  args: { style: { '--loader-duration': '1s' } },
};

/** And the colours are variables too, for a loader on a coloured panel. */
export const OwnColours: Story = {
  args: {
    style: {
      '--loader-color-lead': 'var(--mantine-primary-color-filled)',
      '--loader-color-trail': 'var(--mantine-color-gray-4)',
    },
  },
};
