import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconDots } from '@tabler/icons-react';
import { Button } from '../button/button';
import { MailClassificationCard } from './mail-classification-card';

const meta = {
  title: 'Reporting Button/Components/MailClassificationCard',
  component: MailClassificationCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MailClassificationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Suspicious: Story = {
  args: {
    variant: 'suspicious',
    title: 'Suspicious',
    description: 'Phishing attempt, impersonation, malicious link or attachment',
  },
  render: (args) => <MailClassificationCard {...args} className="w-96" />,
};

export const Spam: Story = {
  args: {
    variant: 'spam',
    title: 'Spam',
    description: 'Unwanted marketing or junk mail',
  },
  render: (args) => <MailClassificationCard {...args} className="w-96" />,
};

/** Passing `action` renders an extra control on the right edge of the card, e.g. an icon button for more options. */
export const WithAction: Story = {
  args: {
    variant: 'suspicious',
    title: 'Suspicious',
    description: 'Phishing attempt, impersonation, malicious link or attachment',
    action: (
      <Button variant="ghost" size="icon" aria-label="More options">
        <IconDots />
      </Button>
    ),
  },
  render: (args) => <MailClassificationCard {...args} className="w-96" />,
};
