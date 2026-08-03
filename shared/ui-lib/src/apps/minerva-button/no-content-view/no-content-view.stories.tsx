import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NoContentView } from './no-content-view.component';

/**
 * The view fills the height it is given, so it needs an ancestor with one. This
 * frame stands in for the pane it would sit in.
 */
const meta = {
  title: 'MinervaButton/NoContentView',
  component: NoContentView,
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
    title: 'No mail open',
    description: 'Open a message to see what Minerva makes of it.',
  },
} satisfies Meta<typeof NoContentView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Without a line under it the view tightens up to the icon and the title. */
export const TitleOnly: Story = {
  args: { description: undefined },
};

/** Nothing came back from the service, which reads differently from nothing being open. */
export const NothingLoaded: Story = {
  args: {
    title: 'Nothing to show',
    description: 'This message has not been looked at yet.',
  },
};

/** As narrow as the taskpane ever gets, which is where the wrapping shows. */
export const NarrowPane: Story = {
  args: { w: 220 },
};
