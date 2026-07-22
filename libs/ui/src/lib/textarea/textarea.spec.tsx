import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders the given placeholder', () => {
    render(<Textarea placeholder="Add any details that might help (optional)" />);

    expect(screen.getByPlaceholderText('Add any details that might help (optional)')).toBeInTheDocument();
  });

  it('accepts typed input', async () => {
    render(<Textarea placeholder="Add any details" />);

    const textarea = screen.getByPlaceholderText('Add any details');
    await userEvent.type(textarea, 'Looks like phishing');

    expect(textarea).toHaveValue('Looks like phishing');
  });

  it('forwards the disabled prop', () => {
    render(<Textarea placeholder="Add any details" disabled />);

    expect(screen.getByPlaceholderText('Add any details')).toBeDisabled();
  });
});
