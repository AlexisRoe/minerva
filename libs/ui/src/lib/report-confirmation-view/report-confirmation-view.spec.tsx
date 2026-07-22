import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportConfirmationView } from './report-confirmation-view';

describe('ReportConfirmationView', () => {
  it('renders the header and how-to list content together', () => {
    const { container } = render(
      <ReportConfirmationView
        title="This was a simulation"
        description="No further action is needed."
        statusMessage="This email has been moved to your Spam folder."
        howToHeading="What to do now"
        howToItems={["Don't click any links.", "Don't reply to the message."]}
      />,
    );

    expect(screen.getByText('This was a simulation')).toBeInTheDocument();
    expect(screen.getByText('No further action is needed.')).toBeInTheDocument();
    expect(screen.getByText('This email has been moved to your Spam folder.')).toBeInTheDocument();
    expect(screen.getByText('What to do now')).toBeInTheDocument();
    expect(screen.getByText("Don't click any links.")).toBeInTheDocument();
    expect(screen.getByText("Don't reply to the message.")).toBeInTheDocument();
    expect(container.querySelector('svg.tabler-icon-mailbox')).toBeInTheDocument();
  });
});
