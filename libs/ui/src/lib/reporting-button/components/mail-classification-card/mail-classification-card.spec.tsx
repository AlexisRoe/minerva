import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MailClassificationCard } from './mail-classification-card';

describe('MailClassificationCard', () => {
  it('renders the given title and description', () => {
    render(<MailClassificationCard variant="suspicious" title="Suspicious" description="Phishing attempt" />);

    expect(screen.getByText('Suspicious')).toBeInTheDocument();
    expect(screen.getByText('Phishing attempt')).toBeInTheDocument();
  });

  it('renders the mail-exclamation icon for the suspicious variant', () => {
    const { container } = render(
      <MailClassificationCard variant="suspicious" title="Suspicious" description="Phishing attempt" />,
    );

    expect(container.querySelector('svg.tabler-icon-mail-exclamation')).toBeInTheDocument();
  });

  it('renders the mail-fast icon for the spam variant', () => {
    const { container } = render(<MailClassificationCard variant="spam" title="Spam" description="Junk mail" />);

    expect(container.querySelector('svg.tabler-icon-mail-fast')).toBeInTheDocument();
  });

  it('renders the action slot when provided', () => {
    render(
      <MailClassificationCard
        variant="spam"
        title="Spam"
        description="Junk mail"
        action={<button type="button">More options</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('does not render an action when none is provided', () => {
    render(<MailClassificationCard variant="spam" title="Spam" description="Junk mail" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
