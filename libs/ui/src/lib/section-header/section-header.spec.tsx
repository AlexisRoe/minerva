import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  it('renders the given title and description', () => {
    render(<SectionHeader title="Report this email" description="Help keep your organization safe." />);

    expect(screen.getByText('Report this email')).toBeInTheDocument();
    expect(screen.getByText('Help keep your organization safe.')).toBeInTheDocument();
  });

  it('renders the title as a heading', () => {
    render(<SectionHeader title="Report this email" description="Help keep your organization safe." />);

    expect(screen.getByRole('heading', { name: 'Report this email' })).toBeInTheDocument();
  });

  it('defaults to left-to-right direction', () => {
    const { container } = render(<SectionHeader title="Title" description="Description" />);

    expect(container.querySelector('[data-slot="section-header"]')).toHaveAttribute('dir', 'ltr');
  });

  it('renders right-to-left when rtl is set', () => {
    const { container } = render(<SectionHeader title="Title" description="Description" rtl />);

    expect(container.querySelector('[data-slot="section-header"]')).toHaveAttribute('dir', 'rtl');
  });
});
