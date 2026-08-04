import { Box } from '@mantine/core';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { LoadingIndicator } from './loading-indicator.component';
import { STEP_TRANSLATIONS } from './loading-indicator.example';
import { mixLanguages } from './loading-indicator.util';

/**
 * The reel centres itself in what it is put in, so every story is given a frame
 * with a height. A story that is about the width sets `frameWidth` to narrow it.
 */
const inFrame: Decorator = (Story, { parameters }): React.ReactElement => (
  <Box w={parameters.frameWidth ?? '100%'} h={360} bd="1px dashed var(--mantine-color-default-border)" bdrs="md">
    <Story />
  </Box>
);

/** The steps of an add-in starting up, for a reel that has something to report. */
const bootSteps = STEP_TRANSLATIONS.en?.steps ?? [];

/**
 * A reel of loading steps, one row lit at a time. It takes the full width of the
 * frame it is in and sits in the middle of it — the dashed border is the frame,
 * not the indicator.
 *
 * Out of the box it says nothing but `loading ...`. Everything else on this page is
 * a list handed to it from outside.
 */
const meta = {
  title: 'MinervaButton/LoadingIndicator',
  component: LoadingIndicator,
  tags: ['autodocs'],
  decorators: [inFrame],
  argTypes: {
    intervalMs: { control: { type: 'number', min: 200, step: 100 } },
    transitionMs: { control: { type: 'number', min: 0, step: 50 } },
    visibleRows: { control: { type: 'number', min: 1, max: 7, step: 2 } },
  },
} satisfies Meta<typeof LoadingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Told nothing, it turns on three of the same line: a spinner made of words. */
export const Default: Story = {};

/** Given a list, it works through it in order and comes back round to the top. */
export const WithSteps: Story = {
  args: { steps: bootSteps },
};

/**
 * The same seven steps with a language drawn for each of them, which is the point
 * of the thing: it deals in strings, and neither the alphabet nor the direction
 * they read in is any of its business.
 */
export const MixedLanguages: Story = {
  args: { steps: mixLanguages(STEP_TRANSLATIONS) },
};

/** A step that runs long wraps to two lines and is cut off after them. */
export const LongSteps: Story = {
  args: {
    steps: [
      'Synchronising every message in the mailbox, including the ones nobody has opened since 2019',
      'Working out which of them anybody still cares about',
      'Almost ready',
    ],
  },
};

/** Turning faster than anything can be read, which is what a wait that short should not be. */
export const FastCycle: Story = {
  args: { steps: bootSteps, intervalMs: 500 },
};

/** Slow enough that each step is read once and then waited on. */
export const SlowCycle: Story = {
  args: { steps: bootSteps, intervalMs: 3000 },
};

/** More of the reel on show: an odd number of rows keeps the current one centred. */
export const FiveRows: Story = {
  args: { steps: bootSteps, visibleRows: 5 },
};

/** One row is the whole window, so the steps replace one another rather than scroll past. */
export const SingleRow: Story = {
  args: { steps: bootSteps, visibleRows: 1 },
};

/** As narrow as the taskpane ever gets, where the reel still fills the width it has. */
export const NarrowPane: Story = {
  args: { steps: bootSteps },
  parameters: { frameWidth: 220 },
};

/** The root is a `Center`, so the room around the reel is a prop like any other. */
export const TighterPadding: Story = {
  args: { steps: bootSteps, p: 'xs' },
};

/** A list of one has nowhere to turn to, so it holds still. */
export const SingleStep: Story = {
  args: { steps: ['Almost ready'] },
};
