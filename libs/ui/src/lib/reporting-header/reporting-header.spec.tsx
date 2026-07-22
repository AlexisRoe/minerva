import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportingHeader } from './reporting-header';

describe('ReportingHeader', () => {
  it('renders the given title', () => {
    render(<ReportingHeader variant="suspicious" title="What makes this suspicious?" />);

    expect(screen.getByText('What makes this suspicious?')).toBeInTheDocument();
  });

  it('renders the mail-exclamation icon for the suspicious variant', () => {
    const { container } = render(<ReportingHeader variant="suspicious" title="What makes this suspicious?" />);

    expect(container.querySelector('svg.tabler-icon-mail-exclamation')).toBeInTheDocument();
  });

  it('renders the mail-fast icon for the spam variant', () => {
    const { container } = render(<ReportingHeader variant="spam" title="What makes this spam?" />);

    expect(container.querySelector('svg.tabler-icon-mail-fast')).toBeInTheDocument();
  });

  it('renders a small icon rather than the large classification-card icon', () => {
    const { container } = render(<ReportingHeader variant="suspicious" title="What makes this suspicious?" />);

    const icon = container.querySelector('svg.tabler-icon-mail-exclamation');
    expect(icon).toHaveClass('size-5');
    expect(icon).not.toHaveClass('size-24');
  });
});
