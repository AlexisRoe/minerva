import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingReel } from './loading-reel';

const meta = {
  title: 'Components/LoadingReel',
  component: LoadingReel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    intervalMs: { control: { type: 'number', min: 200, step: 100 } },
  },
} satisfies Meta<typeof LoadingReel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    intervalMs: 1800,
  },
};

export const FastCycle: Story = {
  args: {
    intervalMs: 500,
  },
};

export const SlowCycle: Story = {
  args: {
    intervalMs: 3000,
  },
};
