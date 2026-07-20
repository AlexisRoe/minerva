import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelloWorld } from './hello-world';

const meta = {
  title: 'Components/HelloWorld',
  component: HelloWorld,
  tags: ['autodocs'],
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    appName: 'storybook',
  },
};

export const WithChildren: Story = {
  args: {
    appName: 'storybook',
    children: <p>Nested content rendered inside the component.</p>,
  },
};
