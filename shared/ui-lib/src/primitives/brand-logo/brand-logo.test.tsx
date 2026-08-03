import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import minervaLogoUrl from '../../assets/minerva-logo.svg';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { BrandLogo } from './brand-logo.component';

function renderLogo(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('BrandLogo', () => {
  it('renders the mark from the logo asset', () => {
    const { container } = renderLogo(<BrandLogo />);

    expect(container.querySelector('img')).toHaveAttribute('src', minervaLogoUrl);
  });

  it('renders the title by default', () => {
    renderLogo(<BrandLogo />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('uppercases the title through CSS, keeping the text itself readable', () => {
    renderLogo(<BrandLogo title="Minerva Manager" />);

    expect(screen.getByText('Minerva Manager')).toHaveStyle({ textTransform: 'uppercase' });
  });

  it('renders the title after the mark', () => {
    const { container } = renderLogo(<BrandLogo />);
    const [mark, title] = Array.from(container.querySelectorAll('img, span'));

    expect(mark?.tagName).toBe('IMG');
    expect(title).toHaveTextContent('Minerva');
  });

  it('keeps the mark decorative while the title speaks for it', () => {
    const { container } = renderLogo(<BrandLogo />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('drops the title and names the bare mark instead', () => {
    renderLogo(<BrandLogo withTitle={false} />);

    expect(screen.queryByText('Minerva')).toBeNull();
    expect(screen.getByRole('img', { name: 'Minerva Logo' })).toBeInTheDocument();
  });

  it('takes a custom accessible name for the bare mark', () => {
    renderLogo(<BrandLogo withTitle={false} alt="Minerva Manager" />);

    expect(screen.getByRole('img', { name: 'Minerva Manager' })).toBeInTheDocument();
  });

  it('holds the title at least 0.75rem away from the mark', () => {
    renderLogo(<BrandLogo data-testid="logo" />);

    expect(screen.getByTestId('logo').style.gap).toBe('0.75rem');
  });

  it('floors a smaller gap at 0.75rem and lets a larger one through', () => {
    renderLogo(
      <>
        <BrandLogo data-testid="tight" gap={4} />
        <BrandLogo data-testid="roomy" gap="4rem" />
      </>,
    );

    // 4px is 0.25rem, so `max()` keeps the tight one at the 0.75rem minimum.
    // jsdom folds a `max()` it can resolve statically, hence `calc(4rem)` below.
    expect(screen.getByTestId('tight').style.gap).toMatch(/^max\(0\.75rem, .*0\.25rem/);
    expect(screen.getByTestId('roomy').style.gap).toBe('calc(4rem)');
  });

  it('resolves a Mantine spacing key to its CSS variable', () => {
    renderLogo(<BrandLogo data-testid="logo" gap="xl" />);

    expect(screen.getByTestId('logo').style.gap).toBe('max(0.75rem, var(--mantine-spacing-xl))');
  });

  it('scales the mark to the size it is given', () => {
    const { container } = renderLogo(<BrandLogo size={64} />);
    const mark = container.querySelector('img');

    // Mantine restates the 64px as rem, so match on that rather than on the raw input.
    expect(mark?.style.width).toContain('4rem');
    expect(mark?.style.height).toContain('4rem');
  });

  it('scales the title with the mark so their heights match', () => {
    renderLogo(<BrandLogo size={64} />);
    const title = screen.getByText('Minerva');

    // 64px is 4rem, divided by the cap-height ratio so the capitals themselves measure 4rem.
    expect(title.style.fontSize).toContain('4rem');
    expect(title.style.fontSize).toContain('/ 0.7');
    expect(title.style.lineHeight).toBe('0.7');
  });

  it('forwards Box props and DOM attributes to the root', () => {
    renderLogo(<BrandLogo className="app-logo" data-testid="logo" />);

    expect(screen.getByTestId('logo')).toHaveClass('app-logo');
  });

  it('lets a caller style override the layout it sets', () => {
    renderLogo(<BrandLogo data-testid="logo" style={{ display: 'grid' }} />);

    expect(screen.getByTestId('logo')).toHaveStyle({ display: 'grid' });
  });
});
