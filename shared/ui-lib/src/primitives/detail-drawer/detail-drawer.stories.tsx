import { Box, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconFilter, IconInfoCircle, IconUser } from '@tabler/icons-react';
import { useState } from 'react';

import { ActionButton } from '../action-button/action-button.example';
import { DetailDrawer, type DetailDrawerProps } from './detail-drawer.example';

type DrawerDemoProps = Omit<DetailDrawerProps, 'opened' | 'onClose' | 'container'>;

/**
 * The box below is the drawer's `container`, so the drawer opens inside the
 * frame instead of sliding over the whole preview. Without it the drawer would
 * portal into `document.body` and cover the page — which is what you want in an
 * app, and what makes a story unreadable.
 */
function DrawerDemo(props: DrawerDemoProps): React.ReactElement {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Box
      ref={setContainer}
      pos="relative"
      h={460}
      style={{
        overflow: 'hidden',
        border: '1px dashed var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <Stack align="flex-start" gap="sm" p="xl">
        <Text size="sm" c="dimmed">
          The drawer opens inside this frame, not over the page.
        </Text>
        <ActionButton label="Open drawer" onClick={open} />
      </Stack>

      <DetailDrawer {...props} container={container} opened={opened} onClose={close} />
    </Box>
  );
}

const meta = {
  title: 'Styled/Components/Drawer',
  component: DrawerDemo,
  tags: ['autodocs'],
  args: {
    label: 'Details',
    children: (
      <Stack gap="xs">
        <Text size="sm">Everything the panel has to say about the selected item.</Text>
        <Text size="sm" c="dimmed">
          Close it with the button in the header, the escape key, or a click on the overlay.
        </Text>
      </Stack>
    ),
  },
} satisfies Meta<typeof DrawerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FromTheRight: Story = {
  args: { label: 'Profile', icon: IconUser, position: 'right' },
};

export const Large: Story = {
  args: { label: 'Filters', icon: IconFilter, position: 'right', size: 'lg' },
};

export const WithoutOverlay: Story = {
  args: { label: 'Hints', icon: IconInfoCircle, withOverlay: false },
};

export const Floating: Story = {
  args: { label: 'Details', position: 'right', offset: 12, radius: 'md', size: 'sm' },
};
