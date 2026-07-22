import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Brand } from './brand';

describe('Brand', () => {
  it('defaults the title to "Minerva"', () => {
    render(<Brand />);
    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<Brand title="Custom App" />);
    expect(screen.getByText('Custom App')).toBeInTheDocument();
  });

  it('renders the logo image', () => {
    const { container } = render(<Brand />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });
});
