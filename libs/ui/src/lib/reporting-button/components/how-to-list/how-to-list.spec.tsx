import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowToList } from './how-to-list';

describe('HowToList', () => {
  it('renders all items in order', () => {
    render(<HowToList items={['First item', 'Second item', 'Third item']} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('First item');
    expect(items[1]).toHaveTextContent('Second item');
    expect(items[2]).toHaveTextContent('Third item');
  });

  it('renders the heading when given', () => {
    render(<HowToList heading="What to do now" items={['First item']} />);

    expect(screen.getByText('What to do now')).toBeInTheDocument();
  });

  it('omits the heading when not given', () => {
    const { container } = render(<HowToList items={['First item']} />);

    expect(container.querySelector('[data-slot="how-to-list-heading"]')).not.toBeInTheDocument();
  });
});
