import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelloWorld } from './hello-world';

describe('HelloWorld', () => {
  it('renders the app name', () => {
    render(<HelloWorld appName="Inspector" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Hello from Inspector');
  });

  it('renders children', () => {
    render(<HelloWorld appName="Inspector">extra content</HelloWorld>);
    expect(screen.getByText('extra content')).toBeDefined();
  });
});
