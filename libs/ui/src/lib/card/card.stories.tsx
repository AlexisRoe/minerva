import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { MailClassificationCard } from '../mail-classification-card/mail-classification-card';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardGroup, CardHeader, CardTitle } from './card';

const meta = {
  title: 'General/Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Weekly report</CardTitle>
        <CardDescription>Summary of activity for the last 7 days.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">3 incidents resolved, 12 alerts triaged, 1 escalation opened.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View full report</Button>
      </CardFooter>
    </Card>
  ),
};

/** `CardGroup` stacks cards vertically with a consistent gap, stretching each to the group's full width. */
export const Group: Story = {
  render: () => (
    <CardGroup className="w-96">
      <MailClassificationCard
        variant="suspicious"
        title="Suspicious"
        description="Phishing attempt, impersonation, malicious link or attachment"
      />
      <MailClassificationCard variant="spam" title="Spam" description="Unwanted marketing or junk mail" />
    </CardGroup>
  ),
};
