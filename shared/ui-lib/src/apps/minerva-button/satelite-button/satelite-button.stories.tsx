import { Box, Group, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SateliteButton } from './satelite-button.component';

/**
 * A bare icon button: no background and no border at rest, just the satellite
 * mark. Put the cursor on it and it turns inside out — the mark's colour fills
 * the box, the icon drops out of it — so it still answers the pointer like a
 * button. It is meant to sit beside content — in a header, next to a line of
 * text — where a filled button would shout.
 */
const meta = {
  title: 'MinervaButton/SateliteButton',
  component: SateliteButton,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof SateliteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default: a `1.5rem` mark, named `Satelite`. Hover it to see it invert. */
export const Default: Story = {};

/** Both sides of the swap follow `color`, so it inverts into whatever the action means. */
export const Colors: Story = {
  render: (args) => (
    <Group>
      <SateliteButton {...args} />
      <SateliteButton {...args} color="blue" />
      <SateliteButton {...args} color="red" />
    </Group>
  ),
};

/** The label is the accessible name, so it should say what pressing it does. */
export const WithLabel: Story = {
  args: { label: 'Scan this mail' },
};

/** `iconSize` sets the mark, and the box follows it, keeping the same room around each. */
export const Sizes: Story = {
  render: (args) => (
    <Group>
      <SateliteButton {...args} iconSize="1rem" />
      <SateliteButton {...args} iconSize="1.5rem" />
      <SateliteButton {...args} iconSize="2rem" />
    </Group>
  ),
};

/** Round by default; `radius` squares the disc off where a panel suits it better. */
export const Shapes: Story = {
  render: (args) => (
    <Group>
      <SateliteButton {...args} />
      <SateliteButton {...args} radius="md" />
      <SateliteButton {...args} radius="xs" />
    </Group>
  ),
};

/** `size` overrides the box outright, for a bigger target and a broader fill. */
export const RoomAroundTheMark: Story = {
  render: (args) => (
    <Group>
      <SateliteButton {...args} />
      <SateliteButton {...args} size="lg" />
      <SateliteButton {...args} size="xl" />
    </Group>
  ),
};

/** Disabled it dims and stops taking clicks, with no border appearing. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Beside a line of copy, which is where the small icon earns its size. */
export const InLine: Story = {
  render: (args) => (
    <Group gap="xs">
      <Text size="sm">Signal check</Text>
      <SateliteButton {...args} label="Run the signal check" />
    </Group>
  ),
};

/**
 * Nothing is painted behind it at rest, so it takes the colour of whatever it
 * sits on. The inversion, though, drops the icon to the *page* colour, not the
 * colour of this box — on a tinted surface, pass a `style` of your own with
 * `--ai-hover-color` set to the surface to keep the swap honest.
 */
export const OnASurface: Story = {
  render: (args) => (
    <Box p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
      <SateliteButton {...args} />
    </Box>
  ),
};
