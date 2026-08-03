import { Box, Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CheckboxWithLabel } from './checkbox-with-label.component';

const meta = {
  title: 'Styled/Components/CheckboxWithLabel',
  component: CheckboxWithLabel,
  tags: ['autodocs'],
  args: {
    label: 'Block this sender',
  },
} satisfies Meta<typeof CheckboxWithLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Where the label alone leaves a question open, the description answers it. */
export const WithDescription: Story = {
  args: { description: 'Their mail goes straight to junk from now on.' },
};

/** The label takes an element, so part of the line can carry its own weight. */
export const RichLabel: Story = {
  args: {
    label: (
      <span>
        Block <strong>news@example.com</strong>
      </span>
    ),
  },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

/** Some of a set ticked, none of them all — the state a group header sits in. */
export const Indeterminate: Story = {
  args: { label: 'All senders', indeterminate: true },
};

export const WithError: Story = {
  args: { error: 'Pick one of the two before reporting.' },
};

export const Disabled: Story = {
  args: { description: 'Only an administrator can block a sender.', disabled: true },
};

/** The box can sit after the label instead, for a settings row read left to right. */
export const LabelOnTheLeft: Story = {
  args: { labelPosition: 'left' },
};

/**
 * The taskpane goes as narrow as this. The label wraps and the box keeps its
 * square, which is what the `inner` style is there for.
 */
export const NarrowPane: Story = {
  args: { label: 'Block this sender and everything else from their domain' },
  decorators: [
    (Story) => (
      <Box
        w={220}
        p="md"
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

/** Several of these belong in a `Checkbox.Group`; on their own they stack. */
export const Several: Story = {
  render: () => (
    <Stack gap="sm">
      <CheckboxWithLabel label="Block this sender" defaultChecked />
      <CheckboxWithLabel label="Delete the mail from my inbox" />
      <CheckboxWithLabel label="Send me the outcome" description="One mail, once the report has been looked at." />
    </Stack>
  ),
};
