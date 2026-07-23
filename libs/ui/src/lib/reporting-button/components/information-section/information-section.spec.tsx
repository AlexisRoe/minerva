import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InformationSection } from './information-section';

describe('InformationSection', () => {
  it('renders the given title', () => {
    render(
      <InformationSection title="User">
        <div>Content</div>
      </InformationSection>,
    );

    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders the given children', () => {
    render(
      <InformationSection title="User">
        <div>Name: Jamie Keller</div>
      </InformationSection>,
    );

    expect(screen.getByText('Name: Jamie Keller')).toBeInTheDocument();
  });

  it('renders a divider between the title and the content', () => {
    const { container } = render(
      <InformationSection title="User">
        <div>Content</div>
      </InformationSection>,
    );

    expect(container.querySelector('[data-slot="information-section-divider"]')).toBeInTheDocument();
  });
});
