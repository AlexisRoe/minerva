import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReportButton } from './report-button.component';

/** The button grows into the height it is offered, so the frame below gives it one. */
const meta = {
  title: 'MinervaButton/ReportButton',
  component: ReportButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box
        w={360}
        h={260}
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
    variant: 'suspicious',
    title: 'Suspicious',
    description: 'Something about this message looks off.',
  },
} satisfies Meta<typeof ReportButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** `IconMailExclamation` beside the text — the mail that needs a second look. */
export const Suspicious: Story = {};

/** `IconMailFast` beside the text — bulk mail nobody asked for. */
export const Spam: Story = {
  args: {
    variant: 'spam',
    title: 'Spam',
    description: 'Bulk mail nobody asked for.',
  },
};

/** A 400px frame is taller than the button's ceiling, so it stops at 200px. */
export const AtItsMaxHeight: Story = {
  decorators: [
    (Story) => (
      <Box
        w={360}
        h={400}
        style={{
          border: '1px dashed var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        <Story />
      </Box>
    ),
  ],
};

/** Long copy wraps in the text column; the icon column keeps its width. */
export const LongDescription: Story = {
  args: {
    description:
      'The sender address does not match the domain it claims, and the links point somewhere else again. Reporting it sends the whole message to review.',
  },
};

/** Disabled comes straight from the underlying button element. */
export const Disabled: Story = {
  args: { disabled: true },
};
