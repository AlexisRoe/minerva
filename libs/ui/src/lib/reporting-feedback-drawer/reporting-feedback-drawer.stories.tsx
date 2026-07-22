import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button/button';
import type { ReportReason } from '../report-reason-list/report-reason-list';
import { ReportingFeedbackDrawer } from './reporting-feedback-drawer';

const suspiciousReasons: ReportReason[] = [
  { id: 'suspicious-link', label: 'Suspicious link or website' },
  { id: 'unusual-attachment', label: 'Unexpected or unusual attachment' },
  { id: 'impersonation', label: 'Impersonates a person or company' },
  { id: 'credentials-request', label: 'Asks for credentials, payment or personal info' },
  { id: 'urgency', label: 'Creates urgency or pressure to act fast' },
  { id: 'other', label: 'Something else feels wrong' },
];

const spamReasons: ReportReason[] = [
  { id: 'unsolicited', label: 'Unsolicited advertising or promotion' },
  { id: 'repeated', label: 'Sent repeatedly from the same sender' },
  { id: 'irrelevant', label: 'Not relevant to me or my role' },
];

const meta = {
  title: 'Reporting Button/Components/ReportingFeedbackDrawer',
  component: ReportingFeedbackDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ReportingFeedbackDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'suspicious',
    title: 'What makes this suspicious?',
    reasons: suspiciousReasons,
    textareaPlaceholder: 'Add any details that might help (optional)',
    primaryButtonText: 'Report as Suspicious',
    outlineButtonText: 'Cancel',
    requireReason: false,
    onPrimaryAction: (values) => {
      console.log('Report submitted', values);
    },
  },
};

/** Demonstrates the built-in "select at least one reason" validation error. */
export const RequireReasonSelected: Story = {
  args: {
    ...Default.args,
    requireReason: true,
  },
};

/** A custom `validate` composes with the built-in required-reason check. */
export const WithCustomValidator: Story = {
  args: {
    ...Default.args,
    requireReason: true,
    validate: (values) =>
      values.reasonIds.includes('other') && values.details.length === 0
        ? 'Please add details when reporting "Something else feels wrong".'
        : undefined,
  },
};

export const SpamVariant: Story = {
  args: {
    type: 'spam',
    title: 'What makes this spam?',
    reasons: spamReasons,
    textareaPlaceholder: 'Add any details that might help (optional)',
    primaryButtonText: 'Report as Spam',
    outlineButtonText: 'Cancel',
    requireReason: false,
    onPrimaryAction: (values) => {
      console.log('Report submitted', values);
    },
  },
};

/** Open state controlled by the parent, driven through an external trigger. */
export const ControlledOpen: Story = {
  args: Default.args,
  render: () => {
    function ControlledOpenExample() {
      const [open, setOpen] = useState(false);

      return (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={() => setOpen(true)}>Open from outside</Button>
          <ReportingFeedbackDrawer
            open={open}
            onOpenChange={setOpen}
            type="suspicious"
            title="What makes this suspicious?"
            reasons={suspiciousReasons}
            textareaPlaceholder="Add any details that might help (optional)"
            primaryButtonText="Report as Suspicious"
            outlineButtonText="Cancel"
            onPrimaryAction={(values) => console.log('Report submitted', values)}
          />
        </div>
      );
    }

    return <ControlledOpenExample />;
  },
};
