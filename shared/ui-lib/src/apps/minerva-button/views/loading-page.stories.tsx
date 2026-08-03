import { Box } from '@mantine/core';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { LoadingPage } from './loading-page.example';

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
 * The pane while it is still coming up: docked to the right of a mail window, the
 * way an Outlook add-in taskpane is. The mail beside it is skeletons — it is there
 * to give the pane its context, nothing more.
 *
 * The header is drawn from the first frame, so what is missing reads as content on
 * its way rather than as a pane that has not opened. The reel takes the rest.
 */
const meta = {
  title: 'MinervaButton/Views/LoadingPage',
  component: LoadingPage,
  tags: ['autodocs'],
  decorators: [inWindow(960, 620)],
} satisfies Meta<typeof LoadingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The startup sequence, at the pace it is usually read at. */
export const Default: Story = {};

/** As narrow as the pane ever gets, which is where the longer steps have to wrap. */
export const NarrowPane: Story = {
  decorators: [inWindow(640, 620)],
};

/** A wait with nothing to report on: the pane says only that it is working. */
export const WithoutSteps: Story = {
  args: { steps: ['loading ...', 'loading ...', 'loading ...'] },
};

/** Turning quickly, for a startup that is getting through its steps. */
export const FastCycle: Story = {
  args: { intervalMs: 600 },
};
