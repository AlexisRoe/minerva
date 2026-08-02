import { Box, Button, Code, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { ActionButton } from '../../../primitives/action-button/action-button.example';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { ButtonDrawer } from '../button-drawer/button-drawer.component';
import {
  type ReportingReason,
  UserFeedback,
  type UserFeedbackProps,
  type UserFeedbackValue,
} from './user-feedback.component';

/** A window with room to spare, so the pane settles at its full width. */
const windowWidth = 960;
const windowHeight = 620;

const reasons: ReportingReason[] = [
  { value: 'sender', label: 'The sender is not who they claim to be' },
  { value: 'links', label: 'It asks me to follow a link' },
  { value: 'credentials', label: 'It asks for a password or a code' },
  { value: 'attachment', label: 'It came with an attachment I did not expect' },
  { value: 'other', label: 'Something else about it looks wrong' },
];

interface UserFeedbackDemoProps extends UserFeedbackProps {
  /** Width of the mail window the pane is docked to, which the drawer measures itself against. */
  width?: number;
  /** Called with what the drawer was carrying when the report was sent. */
  onReport?: (value: UserFeedbackValue) => void;
}

/**
 * The drawer the block is written for: the feedback is its content, and the
 * button that sends it lives in the footer. The state is the whole point of the
 * story — the drawer holds one value, gets it from `onChange`, and hangs the
 * report button on the `isValid` that comes with it.
 */
function UserFeedbackDemo({ width = windowWidth, onReport, ...props }: UserFeedbackDemoProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [feedback, setFeedback] = useState<UserFeedbackValue | null>(null);
  const [reported, setReported] = useState<UserFeedbackValue | null>(null);

  function handleReport() {
    if (!feedback) return;

    setReported(feedback);
    onReport?.(feedback);
    close();
  }

  return (
    <Box w={width} h={windowHeight}>
      <OutlookWindow taskpaneLabel="Report">
        <Box ref={setContainer} pos="relative" h="100%" style={{ overflow: 'hidden' }}>
          <Stack align="flex-start" gap="sm" p="md">
            <Text size="sm" c="dimmed">
              The drawer asks what is wrong with the mail before anything is sent on.
            </Text>

            <ActionButton label="Report this mail" onClick={open} />

            {reported && (
              <Stack gap="xs">
                <Text size="sm">Reported with:</Text>
                <Code block>{JSON.stringify(reported, null, 2)}</Code>
              </Stack>
            )}
          </Stack>

          <ButtonDrawer
            title="Report this mail"
            container={container}
            opened={opened}
            onClose={close}
            footer={
              <>
                {/* The one judgement the block makes, spent: nothing is sent while
                    a mandatory list is still empty. */}
                <Button disabled={!feedback?.isValid} onClick={handleReport}>
                  Report the mail
                </Button>

                <Button variant="outline" onClick={close}>
                  Cancel
                </Button>
              </>
            }
          >
            {/* A closed drawer draws no content, so an answered form is gone by the
                time it is opened again — and says so with a value of its own. */}
            <UserFeedback {...props} onChange={setFeedback} />
          </ButtonDrawer>
        </Box>
      </OutlookWindow>
    </Box>
  );
}

/**
 * What is asked of someone filing a report — a list of reasons, a note, or both —
 * shown where it belongs: in the drawer of the report pane, with the button that
 * sends it in the footer.
 *
 * The block keeps its own answers and hands them out as one value. The drawer
 * around it holds nothing but that value, and disables its report button while
 * `isValid` is false. Send a report and the value it went with is printed in the
 * pane behind.
 */
const meta = {
  title: 'MinervaButton/UserFeedback',
  component: UserFeedbackDemo,
  tags: ['autodocs'],
  args: {
    reasons,
    isMandatory: true,
    hasUserInput: true,
    reasonsLabel: 'What is wrong with it?',
    inputLabel: 'Anything else we should know?',
    inputPlaceholder: 'Anything that would help someone reading this later',
    mandatoryError: 'Pick at least one reason.',
    onReport: fn(),
  },
} satisfies Meta<typeof UserFeedbackDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Both halves, with the list mandatory: the report button stays dead until a box
 * is ticked, and the list says why once it has been in use and left empty.
 */
export const Default: Story = {};

/** With the reasons optional the report may be sent as it stands, note or no note. */
export const Optional: Story = {
  args: { isMandatory: false },
};

/** A report that is nothing but its reasons — no note is asked for, so none is drawn. */
export const ReasonsOnly: Story = {
  args: { hasUserInput: false },
};

/** With a long list the drawer scrolls, and the buttons in the footer stay put. */
export const LongList: Story = {
  args: {
    reasons: [
      ...reasons,
      { value: 'tone', label: 'It pushes me to act quickly' },
      { value: 'grammar', label: 'The writing is not how this sender writes' },
      { value: 'reply-to', label: 'Replying would go somewhere else' },
      { value: 'unknown', label: 'I have never had a mail from this sender' },
      { value: 'invoice', label: 'It is about an invoice or a payment I know nothing about' },
    ],
  },
};

/**
 * The other way round: nothing to tick, so the list is left out entirely. A
 * mandatory flag with no reasons behind it holds nothing up.
 */
export const NoteOnly: Story = {
  args: { reasons: [] },
};

/** A line over the block, for a drawer whose title is about something wider. */
export const WithTitle: Story = {
  args: { title: 'Tell us what is wrong' },
};

/** Two reasons rather than five — the list is whatever it is handed. */
export const ShortList: Story = {
  args: { reasons: reasons.slice(0, 2) },
};

/** A narrow window, where the pane is at its `220px` floor and every label wraps. */
export const NarrowWindow: Story = {
  args: { width: 620 },
};
