import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageDescription } from './page-description.component';

const meta = {
  title: 'MinervaButton/PageDescription',
  component: PageDescription,
  tags: ['autodocs'],
  args: {
    title: 'Report',
    description: 'Everything the last run turned up, newest first.',
  },
} satisfies Meta<typeof PageDescription>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The `h1` at `h3` size, with its description right beneath it. */
export const Default: Story = {};

/** A longer description wraps under the title — nothing here caps its width. */
export const LongDescription: Story = {
  args: {
    description:
      'Every finding of the last run, grouped by the check that raised it. Rows stay in place until the next run replaces them.',
  },
};

/** Both slots take nodes, for when a word needs its own emphasis. */
export const WithNodes: Story = {
  args: {
    title: (
      <>
        Report <span style={{ color: 'var(--mantine-color-dimmed)' }}>#42</span>
      </>
    ),
    description: (
      <>
        Generated <strong>this morning</strong>.
      </>
    ),
  },
};

/** The root is a `Stack`, so Mantine style props apply to the block as a whole. */
export const WithStyleProps: Story = {
  args: {
    p: 'md',
    bd: '1px dashed var(--mantine-color-default-border)',
    bdrs: 'md',
  },
};

/** The gap is the `Stack`'s, so a caller opens the block up with a prop. */
export const WiderGap: Story = {
  args: {
    gap: 'md',
  },
};
