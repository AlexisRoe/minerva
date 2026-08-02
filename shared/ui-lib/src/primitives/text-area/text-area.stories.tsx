import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextArea } from './text-area.component';

/** A long note, for the stories that show where the field stops growing. */
const longNote = [
  'The mail says my mailbox is over quota and that I have to confirm my password',
  'to keep receiving mail. The link goes to a page that looks like our sign-in but',
  'the address is not one of ours. I have not entered anything. The sender is not',
  'in my contacts and the greeting uses my mail address rather than my name.',
].join(' ');

const meta = {
  title: 'Styled/Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  args: {
    label: 'Why are you reporting this mail?',
    placeholder: 'Anything that would help someone reading this later',
  },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Three rows to start with — enough to read as somewhere to write a sentence or two. */
export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'Goes to the security team along with the mail.' },
};

/** Typing past the floor grows the field, up to the eight-row ceiling. */
export const Grown: Story = {
  args: { defaultValue: longNote },
};

/** Past the ceiling the field stops growing and scrolls, so the pane keeps its shape. */
export const AtItsCeiling: Story = {
  args: { defaultValue: `${longNote}\n\n${longNote}` },
};

export const WithError: Story = {
  args: { error: 'Say a little more than that.' },
};

export const Required: Story = {
  args: { withAsterisk: true, required: true },
};

export const Disabled: Story = {
  args: { defaultValue: longNote, disabled: true },
};

/** The bounds are only defaults — a field with more room can be given it. */
export const TallerBounds: Story = {
  args: { minRows: 6, maxRows: 16, defaultValue: longNote },
};

/** The taskpane goes as narrow as this, which is where the row bounds earn their keep. */
export const NarrowPane: Story = {
  args: { defaultValue: longNote },
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
