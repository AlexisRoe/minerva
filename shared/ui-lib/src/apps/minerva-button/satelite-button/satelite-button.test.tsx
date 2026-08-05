import { type RenderResult, render, screen } from '@testing-library/react';
import type { CSSProperties, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { SateliteButton } from './satelite-button.component';

function renderButton(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('SateliteButton', () => {
  it('shows the satellite icon', () => {
    const { container } = renderButton(<SateliteButton />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-satellite');
  });

  it('draws itself without any chrome at rest', () => {
    renderButton(<SateliteButton />);

    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'transparent');
  });

  it('is completely round, so the fill lands as a disc', () => {
    renderButton(<SateliteButton />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-radius')).toBe('50%');
  });

  it('takes a radius of its own to square the disc off', () => {
    renderButton(<SateliteButton radius="xs" />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-radius')).toBe('var(--mantine-radius-xs)');
  });

  it('inverts under the cursor: the mark becomes the surface, the icon the page', () => {
    renderButton(<SateliteButton />);

    const { style } = screen.getByRole('button');

    expect(style.getPropertyValue('--ai-hover')).toBe('var(--ai-color)');
    expect(style.getPropertyValue('--ai-hover-color')).toBe('var(--mantine-color-body)');
  });

  it('leaves the swap to a caller who styles it themselves', () => {
    renderButton(<SateliteButton style={{ '--ai-hover': 'rebeccapurple' } as CSSProperties} />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-hover')).toBe('rebeccapurple');
  });

  it('renders the icon at one and a half lines of text', () => {
    const { container } = renderButton(<SateliteButton />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '1.5rem');
    expect(container.querySelector('svg')).toHaveAttribute('height', '1.5rem');
  });

  it('takes an icon size of its own, as a length or as px', () => {
    const { container } = renderButton(
      <>
        <SateliteButton iconSize="1rem" />
        <SateliteButton iconSize={24} />
      </>,
    );

    const [asLength, asPixels] = Array.from(container.querySelectorAll('svg'));

    expect(asLength).toHaveAttribute('width', '1rem');
    expect(asPixels).toHaveAttribute('width', '24');
  });

  it('names itself, since the icon is all it shows', () => {
    renderButton(<SateliteButton />);

    expect(screen.getByRole('button', { name: 'Satelite' })).toBeInTheDocument();
  });

  it('takes a name of its own', () => {
    renderButton(<SateliteButton label="Scan this mail" />);

    expect(screen.getByRole('button', { name: 'Scan this mail' })).toBeInTheDocument();
  });

  it('keeps the icon out of the accessible name the label gives', () => {
    const { container } = renderButton(<SateliteButton />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();

    renderButton(<SateliteButton onClick={onClick} />);
    screen.getByRole('button').click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps room around the mark for the hover fill to land in', () => {
    renderButton(<SateliteButton />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-size')).toBe('calc(1.5rem + 0.75rem)');
  });

  it('grows the box with the icon, so the room around it stays the same', () => {
    renderButton(<SateliteButton iconSize="2rem" />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-size')).toBe('calc(2rem + 0.75rem)');
  });

  it('takes an icon size in px without breaking the box it works out', () => {
    renderButton(<SateliteButton iconSize={24} />);

    expect(screen.getByRole('button').style.getPropertyValue('--ai-size')).toBe('calc(24px + 0.75rem)');
  });

  it('takes a size of its own, for a hit area bigger than the mark', () => {
    renderButton(<SateliteButton size="lg" />);

    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg');
  });

  it('forwards props and DOM attributes to the button', () => {
    renderButton(<SateliteButton className="satelite" data-testid="satelite" disabled />);

    expect(screen.getByTestId('satelite')).toHaveClass('satelite');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
