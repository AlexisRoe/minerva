import { Group, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandLogo } from './brand-logo.component';

const meta = {
  title: 'Styled/Components/BrandLogo',
  component: BrandLogo,
  tags: ['autodocs'],
  args: {
    size: 64,
  },
} satisfies Meta<typeof BrandLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The mark on the left, the uppercase title on the right, 0.75rem apart. */
export const Default: Story = {};

/** `withTitle={false}` leaves the bare mark — which then carries the accessible name itself. */
export const MarkOnly: Story = {
  args: { withTitle: false },
};

/** The title is uppercased in CSS, so pass it in whatever casing reads best in code. */
export const CustomTitle: Story = {
  args: { title: 'Minerva Manager' },
};

/**
 * `gap` is floored at 0.75rem: `xs` and `4` render at the minimum, larger values
 * come through as given.
 */
export const Gaps: Story = {
  render: (args) => (
    <Stack gap="lg">
      {([undefined, 'xs', 4, '4rem'] as const).map((gap) => (
        <Group key={String(gap)} gap="md" align="center">
          <Text size="xs" c="dimmed" w={80} ff="monospace">
            {gap === undefined ? 'default' : JSON.stringify(gap)}
          </Text>
          <BrandLogo {...args} gap={gap} size={40} />
        </Group>
      ))}
    </Stack>
  ),
};

/** The asset is vector-only, so every size is the same file. */
export const Sizes: Story = {
  render: (args) => (
    <Stack gap="lg" align="flex-start">
      {[24, 40, 64, 96].map((size) => (
        <BrandLogo {...args} key={size} size={size} />
      ))}
    </Stack>
  ),
};

/** The root is a `Box`, so Mantine style props apply to the logo as a whole. */
export const WithStyleProps: Story = {
  args: {
    size: 32,
    p: 'md',
    style: { border: '1px dashed var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' },
  },
};
