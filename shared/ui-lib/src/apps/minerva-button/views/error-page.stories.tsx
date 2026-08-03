import { Box } from '@mantine/core';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { ErrorPage } from './error-page.example';

/** Puts the page in the taskpane of a mail window of the given size. */
function inWindow(width: number | string, height: number): Decorator {
  return (Story) => (
    <Box w={width} h={height}>
      <OutlookWindow taskpaneLabel="Report">
        <Story />
      </OutlookWindow>
    </Box>
  );
}

/**
 * The error page as it is actually seen: docked to the right of a mail window, the
 * way an Outlook add-in taskpane is. The mail beside it is skeletons — it is there
 * to give the pane its context, nothing more.
 *
 * The pane sits between `220px` and `350px` wide, is at least `400px` tall, and
 * otherwise takes the full height of the window.
 */
const meta = {
  title: 'MinervaButton/Views/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  decorators: [inWindow(960, 620)],
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A window with room to spare: the pane settles at its `350px` ceiling. */
export const Default: Story = {};

/** Nothing to retry — the view ends after the references, with no button under them. */
export const WithoutRetry: Story = {
  args: { onRetry: undefined },
};

/** As narrow as the pane ever gets, which is where the uuid has to wrap. */
export const NarrowPane: Story = {
  decorators: [inWindow(640, 620)],
};
