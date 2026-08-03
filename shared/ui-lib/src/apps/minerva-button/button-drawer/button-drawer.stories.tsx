import { Box, Button, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { ActionButton } from '../../../primitives/action-button/action-button.example';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { ButtonDrawer, type ButtonDrawerProps } from './button-drawer.component';

/** A window with room to spare, so the pane settles at its full width. */
const windowWidth = 960;
const windowHeight = 620;

const paragraphs = [
  'The message was sent from outside the organisation and the sender address does not match the display name.',
  'Two links in the body point at a domain registered in the last week.',
  'The attachment is a document with macros, which the mail flow rules would normally have stripped.',
  'Nobody else in the organisation has had a message from this sender before.',
  'Reporting it hands all of the above to the security team along with the message itself.',
];

interface ButtonDrawerDemoProps extends Omit<ButtonDrawerProps, 'opened' | 'onClose' | 'container' | 'footer'> {
  /** Width of the mail window the pane is docked to, which is what the drawer measures itself against. */
  width?: number;
  /** The footer, built around the story's own `close` — the buttons have to be able to reach it. */
  footer?: (close: () => void) => ReactNode;
}

interface DemoPaneProps {
  /** Width of the mail window the pane is docked to. */
  width?: number;
  /** Opens the drawer the pane is given. */
  onOpen: () => void;
  /** The drawer itself, which needs the pane to render into. */
  children: (container: HTMLDivElement | null) => ReactNode;
}

/**
 * The pane is the drawer's `container`, so it opens over the taskpane rather than
 * over the whole mail window — which is where an add-in's drawer belongs, and what
 * keeps the story readable.
 */
function DemoPane({ width = windowWidth, onOpen, children }: DemoPaneProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <Box w={width} h={windowHeight}>
      <OutlookWindow taskpaneLabel="Report">
        <Box ref={setContainer} pos="relative" h="100%" style={{ overflow: 'hidden' }}>
          <Stack align="flex-start" gap="sm" p="md">
            <Text size="sm" c="dimmed">
              The drawer covers this pane, and comes in from its right edge.
            </Text>

            <ActionButton label="Open drawer" onClick={onOpen} />
          </Stack>

          {children(container)}
        </Box>
      </OutlookWindow>
    </Box>
  );
}

function ButtonDrawerDemo({ children, width, footer, ...props }: ButtonDrawerDemoProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <DemoPane width={width} onOpen={open}>
      {(container) => (
        <ButtonDrawer {...props} container={container} opened={opened} onClose={close} footer={footer?.(close)}>
          {children}
        </ButtonDrawer>
      )}
    </DemoPane>
  );
}

/** The same panel as the props build, put together part by part instead. */
function ComposedDrawerDemo() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <DemoPane onOpen={open}>
      {(container) => (
        <ButtonDrawer.Root container={container} opened={opened} onClose={close}>
          <ButtonDrawer.Header>Why this was flagged</ButtonDrawer.Header>

          <ButtonDrawer.Body>
            <Stack gap="md">
              {paragraphs.map((paragraph) => (
                <Text key={paragraph} size="sm">
                  {paragraph}
                </Text>
              ))}
            </Stack>
          </ButtonDrawer.Body>

          <ButtonDrawer.Footer>
            <Button variant="outline" onClick={close}>
              Close
            </Button>
          </ButtonDrawer.Footer>
        </ButtonDrawer.Root>
      )}
    </DemoPane>
  );
}

/**
 * A drawer for the report pane: always from the right, always the full width of
 * the pane less the offset it floats by. Under the header the content scrolls and
 * the footer does not — the buttons in it are the story's, not the component's,
 * which ships the block empty. Each button takes the full width, one under the
 * next, and a drawer with no footer takes a close button in its header instead.
 */
const meta = {
  title: 'MinervaButton/ButtonDrawer',
  component: ButtonDrawerDemo,
  tags: ['autodocs'],
  args: {
    title: 'Why this was flagged',
    footer: (close) => (
      <Button variant="outline" onClick={close}>
        Close
      </Button>
    ),
    children: (
      <Stack gap="md">
        {paragraphs.map((paragraph) => (
          <Text key={paragraph} size="sm">
            {paragraph}
          </Text>
        ))}
      </Stack>
    ),
  },
} satisfies Meta<typeof ButtonDrawerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** More content than the pane is tall: it scrolls, and the footer holds its place. */
export const Default: Story = {};

/** Too little to scroll, and the footer still sits at the foot rather than under the text. */
export const ShortContent: Story = {
  args: {
    title: 'Reported',
    children: <Text size="sm">The security team has the message and will come back to you.</Text>,
  },
};

/**
 * Two buttons stack rather than share the row — the one that finishes the job on
 * top, the way out under it.
 */
export const TwoButtons: Story = {
  args: {
    footer: (close) => (
      <>
        <Button onClick={close}>Report the mail</Button>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
      </>
    ),
  },
};

/**
 * With nothing in the footer there is no way out of the panel, so the header takes
 * a close button back — and the footer is left off rather than drawn empty.
 */
export const WithoutFooter: Story = {
  args: { footer: undefined },
};

/** With no title and no footer, the header is the close button on its own. */
export const CloseButtonOnly: Story = {
  args: { title: undefined, footer: undefined },
};

/** With no title there is no header at all, and the content starts at the top of the panel. */
export const WithoutTitle: Story = {
  args: { title: undefined },
};

/** Without the overlay the pane behind stays legible, and clicking it no longer closes the drawer. */
export const WithoutOverlay: Story = {
  args: { withOverlay: false },
};

/** A narrow window, where the pane — and with it the drawer — is down to its `220px` floor. */
export const NarrowWindow: Story = {
  args: { width: 620 },
};

/**
 * The same panel, composed of the parts the drawer is built from rather than
 * handed to it as props: `ButtonDrawer.Root`, `.Header`, `.Body` and `.Footer`.
 * Nothing is decided for the caller here — the close button and the footer are
 * both theirs to place, so a header can carry a cross over a footer full of
 * buttons if that is what a panel wants.
 */
export const ComposedByHand: Story = {
  render: () => <ComposedDrawerDemo />,
};
