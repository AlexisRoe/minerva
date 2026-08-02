import { Anchor, Box, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConfirmationView } from './confirmation-view.component';

/**
 * The view fills the height it is given, so it needs an ancestor with one. This
 * frame stands in for the pane it would sit in.
 */
const meta = {
  title: 'MinervaButton/ConfirmationView',
  component: ConfirmationView,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box h={480} bd="1px dashed var(--mantine-color-default-border)" bdrs="md">
        <Story />
      </Box>
    ),
  ],
  args: {
    title: 'Thanks for reporting',
    description: 'The mail is on its way to the security team.',
    statusMessage: 'It has been moved out of your inbox into Deleted Items.',
    detailsTitle: 'What happens next',
    details: [
      'The security team looks at the mail.',
      'You hear back only if they need something from you.',
      'Nothing else is expected of you in the meantime.',
    ],
  },
} satisfies Meta<typeof ConfirmationView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Everything it can say: the copy, the rule and the outcome, then the list. */
export const Default: Story = {};

/** A report that is simply done — no rules, since there is nothing under them. */
export const CopyOnly: Story = {
  args: {
    statusMessage: undefined,
    detailsTitle: undefined,
    details: undefined,
  },
};

/** Where the mail went, and nothing further asked of the reader. */
export const StatusOnly: Story = {
  args: {
    detailsTitle: undefined,
    details: undefined,
  },
};

/** The list on its own, for a report that leaves the mail where it was. */
export const DetailsOnly: Story = {
  args: { statusMessage: undefined },
};

/** The heading is optional: the list can follow the rule on its own. */
export const DetailsWithoutTitle: Story = {
  args: { detailsTitle: undefined },
};

/** The description takes an element where a line of plain text will not do. */
export const RichDescription: Story = {
  args: {
    description: (
      <Text size="sm" span>
        The mail is on its way to the security team. Anything you are unsure of goes to{' '}
        <Anchor href="mailto:support@example.net">support</Anchor>.
      </Text>
    ),
  },
};

/** A single line of what follows, which is the shortest the list ever gets. */
export const SingleDetail: Story = {
  args: { details: ['The security team looks at the mail.'] },
};

/** As narrow as the taskpane ever gets, which is where every line has to wrap. */
export const NarrowPane: Story = {
  args: { w: 220 },
};

/** The root is a `Stack`, so the room between the blocks is a prop like any other. */
export const WiderGap: Story = {
  args: { gap: 'md' },
};
