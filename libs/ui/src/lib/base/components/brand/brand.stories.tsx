import type { Meta, StoryObj } from '@storybook/react-vite';
import { Brand } from './brand';

const meta = {
  title: 'General/Components/Brand',
  component: Brand,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Brand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

/** A custom title, overriding the default "Minerva" shown next to the logo. */
export const CustomTitle: Story = {
  args: {
    title: 'Custom App',
  },
};
