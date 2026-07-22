import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportConfirmationHeader } from './report-confirmation-header';

describe('ReportConfirmationHeader', () => {
  it('renders the given title and description', () => {
    render(<ReportConfirmationHeader title="This was a simulation" description="No further action is needed." />);

    expect(screen.getByText('This was a simulation')).toBeInTheDocument();
    expect(screen.getByText('No further action is needed.')).toBeInTheDocument();
  });

  it('renders the mailbox icon', () => {
    const { container } = render(<ReportConfirmationHeader title="Title" description="Description" />);

    expect(container.querySelector('svg.tabler-icon-mailbox')).toBeInTheDocument();
  });

  it('renders the status message when given', () => {
    render(
      <ReportConfirmationHeader
        title="Title"
        description="Description"
        statusMessage="This email has been moved to your Spam folder."
      />,
    );

    expect(screen.getByText('This email has been moved to your Spam folder.')).toBeInTheDocument();
  });

  it('omits the status message and divider when not given', () => {
    const { container } = render(<ReportConfirmationHeader title="Title" description="Description" />);

    expect(container.querySelector('[data-slot="report-confirmation-header-status"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="report-confirmation-header-divider"]')).not.toBeInTheDocument();
  });
});
