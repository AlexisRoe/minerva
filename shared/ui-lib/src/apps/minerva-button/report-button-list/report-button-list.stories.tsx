import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReportButton } from '../report-button/report-button.component';
import { ReportButtonList } from './report-button-list.component';

/** The list is `height: 100%`, so it needs an ancestor with a height to share out. */
const meta = {
  title: 'MinervaButton/ReportButtonList',
  component: ReportButtonList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box
        w={360}
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
    children: (
      <>
        <ReportButton variant="suspicious" title="Suspicious" description="Something about this message looks off." />
        <ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />
      </>
    ),
  },
} satisfies Meta<typeof ReportButtonList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both buttons split the height, a `1rem` gap between them. */
export const Default: Story = {};

/** One button on its own takes the room it is given, up to its own 200px ceiling. */
export const SingleButton: Story = {
  args: {
    children: <ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />,
  },
};

/** Past three buttons the height runs out, and each settles at its content height. */
export const ManyButtons: Story = {
  args: {
    children: (
      <>
        <ReportButton variant="suspicious" title="Suspicious" description="Looks off." />
        <ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />
        <ReportButton variant="suspicious" title="Phishing" description="Asks for a password." />
        <ReportButton variant="spam" title="Newsletter" description="Never subscribed to it." />
      </>
    ),
  },
};

/** A caller's `style` is merged last, so it wins over the layout the list sets. */
export const WiderGap: Story = {
  args: { style: { gap: '2rem' } },
};
