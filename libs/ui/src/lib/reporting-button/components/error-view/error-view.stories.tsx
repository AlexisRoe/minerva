import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorView } from './error-view';

const meta = {
  title: 'Reporting Button/Components/ErrorView',
  component: ErrorView,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ErrorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Something went wrong',
    description: "We couldn't submit your report. Please try again.",
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    errorCode: 'ERR_500',
    buttonText: 'Try again',
    onButtonClick: () => console.log('Try again clicked'),
  },
  render: (args) => <ErrorView {...args} className="border" />,
};
