import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Page } from './page';

describe('Page', () => {
  it('renders Page.Header when composed inside Page', () => {
    render(
      <Page>
        <Page.Header left="Logo" />
        <Page.Content>content</Page.Content>
      </Page>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('suppresses Page.Header when Page is fullscreen', () => {
    render(
      <Page fullscreen>
        <Page.Header left="Logo" />
        <Page.Content>content</Page.Content>
      </Page>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('does not render Page.Header when it is not composed', () => {
    render(
      <Page>
        <Page.Content>content</Page.Content>
      </Page>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('applies centering classes to Page.Content when centered', () => {
    render(
      <Page>
        <Page.Content centered>content</Page.Content>
      </Page>,
    );
    expect(screen.getByText('content')).toHaveClass('items-center', 'justify-center');
  });
});
