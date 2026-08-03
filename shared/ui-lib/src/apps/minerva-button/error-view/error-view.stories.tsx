import { Anchor, Box, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorView } from './error-view.component';

/**
 * The view fills the height it is given, so it needs an ancestor with one. This
 * frame stands in for the pane it would sit in.
 */
const meta = {
  title: 'MinervaButton/ErrorView',
  component: ErrorView,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box h={360} bd="1px dashed var(--mantine-color-default-border)" bdrs="md">
        <Story />
      </Box>
    ),
  ],
  args: {
    title: 'Reporting failed',
    description: 'The mail was not sent on. Nothing has been reported.',
    errorId: '3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31',
    errorCode: 'ERR_800',
  },
} satisfies Meta<typeof ErrorView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No way out of this one, so the view ends after the references. */
export const Default: Story = {};

/** A label and an action together are what draw the button. */
export const WithButton: Story = {
  args: {
    buttonLabel: 'Try again',
    buttonAction: () => {},
  },
};

/** A label on its own is not enough — nothing to do means no button. */
export const LabelWithoutAction: Story = {
  args: { buttonLabel: 'Try again' },
};

/** The description takes an element where a line of plain text will not do. */
export const RichDescription: Story = {
  args: {
    description: (
      <Text size="sm" span>
        The mail was not sent on. Quote the references below to{' '}
        <Anchor href="mailto:support@example.net">support</Anchor>.
      </Text>
    ),
    buttonLabel: 'Try again',
    buttonAction: () => {},
  },
};

/** A failure with no code to quote shows the id alone. */
export const IdOnly: Story = {
  args: { errorCode: undefined },
};

/** With neither reference the block is left out rather than held open. */
export const WithoutReferences: Story = {
  args: {
    errorId: undefined,
    errorCode: undefined,
    buttonLabel: 'Try again',
    buttonAction: () => {},
  },
};

/** As narrow as the taskpane ever gets, which is where the uuid has to wrap. */
export const NarrowPane: Story = {
  args: { w: 220, buttonLabel: 'Try again', buttonAction: () => {} },
};
