import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '../checkbox/checkbox';
import { Label } from './label';

describe('Label', () => {
  it('renders the given text', () => {
    render(<Label htmlFor="foo">Send me marketing emails</Label>);

    expect(screen.getByText('Send me marketing emails')).toBeInTheDocument();
  });

  it('sets htmlFor from the given prop', () => {
    render(<Label htmlFor="marketing-emails">Send me marketing emails</Label>);

    expect(screen.getByText('Send me marketing emails')).toHaveAttribute('for', 'marketing-emails');
  });

  it('toggles an associated checkbox when clicked', async () => {
    render(
      <>
        <Checkbox id="marketing-emails" />
        <Label htmlFor="marketing-emails">Send me marketing emails</Label>
      </>,
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(screen.getByText('Send me marketing emails'));

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });
});
