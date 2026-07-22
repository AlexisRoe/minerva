import type { Meta, StoryObj } from '@storybook/react-vite';
import { HowToList } from './how-to-list';

const meta = {
  title: 'Reporting Button/Components/HowToList',
  component: HowToList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HowToList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'What to do now',
    items: [
      "Don't click any links or open attachments from this sender.",
      "Don't reply to or forward the message to others.",
      'If you already interacted with it, contact the Security Team right away.',
    ],
  },
  render: (args) => <HowToList {...args} className="w-96" />,
};

/** Without a `heading`, only the bulleted list is rendered. */
export const WithoutHeading: Story = {
  args: {
    items: [
      "Don't click any links or open attachments from this sender.",
      "Don't reply to or forward the message to others.",
    ],
  },
  render: (args) => <HowToList {...args} className="w-96" />,
};
