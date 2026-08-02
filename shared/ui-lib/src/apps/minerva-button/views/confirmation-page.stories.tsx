import { Box } from '@mantine/core';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { ConfirmationPage } from './confirmation-page.example';

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
 * The confirmation as it is actually seen: docked to the right of a mail window,
 * the way an Outlook add-in taskpane is. The mail beside it is skeletons — it is
 * there to give the pane its context, nothing more.
 *
 * The pane sits between `220px` and `350px` wide, is at least `400px` tall, and
 * otherwise takes the full height of the window.
 */
const meta = {
  title: 'MinervaButton/Views/ConfirmationPage',
  component: ConfirmationPage,
  tags: ['autodocs'],
  decorators: [inWindow(960, 620)],
} satisfies Meta<typeof ConfirmationPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A suspicious mail has gone: where it went, and what follows from here. */
export const Default: Story = {};

/** Spam is filed and forgotten, so the page ends after where the mail went. */
export const ReportedAsSpam: Story = {
  args: { reportedAs: 'spam' },
};

/** As narrow as the pane ever gets, which is where every line has to wrap. */
export const NarrowPane: Story = {
  decorators: [inWindow(640, 620)],
};
