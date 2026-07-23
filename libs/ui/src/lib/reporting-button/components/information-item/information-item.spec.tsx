import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InformationItem } from './information-item';

describe('InformationItem', () => {
  it('renders the given label and value', () => {
    render(<InformationItem label="Name" value="Jamie Keller" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Jamie Keller')).toBeInTheDocument();
  });
});
