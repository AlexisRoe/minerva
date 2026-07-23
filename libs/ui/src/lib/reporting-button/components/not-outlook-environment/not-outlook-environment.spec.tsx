import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotOutlookEnvironment } from './not-outlook-environment';

describe('NotOutlookEnvironment', () => {
  it('renders the given title and description', () => {
    render(<NotOutlookEnvironment title="Not running in Outlook" description="Open this add-in from Outlook." />);

    expect(screen.getByText('Not running in Outlook')).toBeInTheDocument();
    expect(screen.getByText('Open this add-in from Outlook.')).toBeInTheDocument();
  });

  it('renders the world-off icon', () => {
    const { container } = render(<NotOutlookEnvironment title="Title" description="Description" />);

    expect(container.querySelector('svg.tabler-icon-world-off')).toBeInTheDocument();
  });

  it('does not render any button', () => {
    render(<NotOutlookEnvironment title="Title" description="Description" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
