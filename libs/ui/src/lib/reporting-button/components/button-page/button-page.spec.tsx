import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ButtonPage } from './button-page';

describe('ButtonPage', () => {
  it('renders ButtonPage.Header when composed inside ButtonPage', () => {
    render(
      <ButtonPage>
        <ButtonPage.Header />
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('keeps ButtonPage.Header visible when ButtonPage is fullscreen', () => {
    render(
      <ButtonPage fullscreen>
        <ButtonPage.Header />
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('does not render ButtonPage.Header when it is not composed', () => {
    render(
      <ButtonPage>
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('defaults the header title to "Minerva"', () => {
    render(
      <ButtonPage>
        <ButtonPage.Header />
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('renders a custom header title when provided', () => {
    render(
      <ButtonPage>
        <ButtonPage.Header title="Custom App" />
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByText('Custom App')).toBeInTheDocument();
  });

  it('applies centering classes to ButtonPage.Content when centered', () => {
    render(
      <ButtonPage>
        <ButtonPage.Content centered>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByTestId('page-content')).toHaveClass('items-center', 'justify-center');
  });

  it('centers ButtonPage.Content when ButtonPage is fullscreen, even without the centered prop', () => {
    render(
      <ButtonPage fullscreen>
        <ButtonPage.Content>content</ButtonPage.Content>
      </ButtonPage>,
    );
    expect(screen.getByTestId('page-content')).toHaveClass('items-center', 'justify-center');
  });
});
