import { Box, Stack, Text, Title } from '@mantine/core';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { OutlookWindow } from './outlook-window.component';

/** Sizes the frame the window fills, which is what decides how much the taskpane gets. */
function inFrame(width: number | string, height: number): Decorator {
  return (Story) => (
    <Box w={width} h={height}>
      <Story />
    </Box>
  );
}

/**
 * The frame an add-in taskpane is seen inside: a mail window drawn as skeletons,
 * with the pane docked to its right. Everything passed as `children` goes into
 * the pane — the window itself carries no copy at all.
 */
const meta = {
  title: 'Styled/Components/OutlookWindow',
  component: OutlookWindow,
  tags: ['autodocs'],
  decorators: [inFrame(960, 620)],
  args: {
    children: (
      <Stack gap="xs" p="lg">
        <Title order={2} size="h4">
          Taskpane
        </Title>
        <Text size="sm" c="dimmed">
          Whatever the add-in renders goes here, between 220px and 350px wide.
        </Text>
      </Stack>
    ),
  },
} satisfies Meta<typeof OutlookWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A window with room to spare: the pane settles at its `350px` ceiling. */
export const Default: Story = {};

/** A narrow window; the mail panes give way first, then the pane stops at `220px`. */
export const NarrowWindow: Story = {
  decorators: [inFrame(620, 620)],
};

/** A frame shorter than the window's floor — the pane keeps its `400px` height. */
export const ShortWindow: Story = {
  decorators: [inFrame(960, 320)],
};

/** Without children the pane is simply empty, and the mail beside it unchanged. */
export const EmptyTaskpane: Story = {
  args: { children: undefined },
};
