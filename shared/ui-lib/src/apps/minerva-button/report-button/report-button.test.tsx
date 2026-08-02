import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ReportButton } from './report-button.component';

function renderButton(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ReportButton', () => {
  it('renders the title as a second-level heading', () => {
    renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Spam');
  });

  it('sizes the h2 like an h5', () => {
    renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />);

    // Mantine sizes a Title through this variable, so the h5 scale shows up there.
    expect(screen.getByRole('heading', { level: 2 }).style.getPropertyValue('--title-fz')).toBe(
      'var(--mantine-h5-font-size)',
    );
  });

  it('turns its colours over under the pointer, ink for fill and page for type', () => {
    renderButton(<ReportButton data-testid="report" variant="spam" title="Spam" description="Bulk mail." />);

    // Mantine hovers a button through these two variables, so the swap shows up
    // there rather than in a rule jsdom would have to apply to see it.
    const report = screen.getByTestId('report');

    expect(report.style.getPropertyValue('--button-hover')).toBe('var(--button-color)');
    expect(report.style.getPropertyValue('--button-hover-color')).toBe('var(--mantine-color-body)');
  });

  it('leaves the icon and the title to follow that colour rather than setting their own', () => {
    const { container } = renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail." />);

    // A tabler icon strokes itself in `currentColor`, and a Title carries no colour
    // of its own — both inherit the button's, so both turn over with it.
    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'currentColor');
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveStyle({ color: 'var(--mantine-color-text)' });
  });

  it('holds the description back by thinning the button colour, not by a colour of its own', () => {
    renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail." />);

    // Read off the inline style rather than through `toHaveStyle`, which resolves
    // `inherit` against a document that has no button colour to inherit.
    expect(screen.getByText('Bulk mail.').style.color).toBe('inherit');
    expect(screen.getByText('Bulk mail.')).toHaveStyle({ opacity: '0.6' });
  });

  it('renders the description under the title', () => {
    renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail nobody asked for." />);

    const [title, description] = Array.from(screen.getByText('Spam').parentElement?.children ?? []);

    expect(title).toHaveTextContent('Spam');
    expect(description).toHaveTextContent('Bulk mail nobody asked for.');
  });

  it('gives each variant its own icon, left of the text', () => {
    const { container } = renderButton(
      <>
        <ReportButton variant="suspicious" title="Suspicious" description="Looks off." />
        <ReportButton variant="spam" title="Spam" description="Bulk mail." />
      </>,
    );

    const [suspicious, spam] = Array.from(container.querySelectorAll('button'));

    expect(suspicious?.querySelector('svg')).toHaveClass('tabler-icon-mail-exclamation');
    expect(spam?.querySelector('svg')).toHaveClass('tabler-icon-mail-fast');
    // The icon column comes first, the text column right after it.
    expect(suspicious?.querySelector('svg')?.nextElementSibling).toHaveTextContent('Suspicious');
  });

  it('draws itself as an outline button, whichever report it files', () => {
    renderButton(<ReportButton data-testid="report" variant="spam" title="Spam" description="Bulk mail." />);

    expect(screen.getByTestId('report')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByTestId('report')).toHaveAttribute('data-report-variant', 'spam');
  });

  it('renders the icon at 48px', () => {
    const { container } = renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail." />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '48');
  });

  it('keeps the icon out of the accessible name the text already gives', () => {
    const { container } = renderButton(<ReportButton variant="spam" title="Spam" description="Bulk mail." />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['suspicious', 'spam'] as const)('reports %s when clicked', (variant) => {
    const onReport = vi.fn();

    renderButton(<ReportButton variant={variant} title="Report" description="Body" onReport={onReport} />);
    screen.getByRole('button').click();

    expect(onReport).toHaveBeenCalledExactlyOnceWith(variant);
  });

  it('still calls a caller onClick alongside onReport', () => {
    const onClick = vi.fn();
    const onReport = vi.fn();

    renderButton(<ReportButton variant="spam" title="Spam" description="Body" onClick={onClick} onReport={onReport} />);
    screen.getByRole('button').click();

    expect(onClick).toHaveBeenCalledOnce();
    expect(onReport).toHaveBeenCalledOnce();
  });

  it('does nothing beyond the click when no handler is given', () => {
    renderButton(<ReportButton variant="spam" title="Spam" description="Body" />);

    expect(() => screen.getByRole('button').click()).not.toThrow();
  });

  it('fills the width it is given and stops growing at 200px', () => {
    renderButton(<ReportButton data-testid="report" variant="spam" title="Spam" description="Body" />);

    const report = screen.getByTestId('report');

    expect(report).toHaveStyle({ width: '100%', height: '100%' });
    // Mantine takes a size prop to rem and hangs the theme's scale off it, so 200px arrives as its own multiple.
    expect(report.style.maxHeight).toBe('calc(12.5rem * var(--mantine-scale))');
  });

  it('pads its content by a theme step and holds the columns that far apart', () => {
    const { container } = renderButton(
      <ReportButton data-testid="report" variant="spam" title="Spam" description="Body" />,
    );

    expect(screen.getByTestId('report').style.padding).toBe('var(--mantine-spacing-md)');
    expect(container.querySelector('svg')?.parentElement).toHaveStyle({
      display: 'grid',
      gap: 'var(--mantine-spacing-md)',
    });
  });

  it('centres the icon and the text in the height the button has', () => {
    const { container } = renderButton(<ReportButton variant="spam" title="Spam" description="Body" />);

    expect(container.querySelector('svg')?.parentElement).toHaveStyle({ height: '100%', alignItems: 'center' });
  });

  it('takes nodes as well as strings', () => {
    renderButton(<ReportButton variant="spam" title={<span>Spam</span>} description={<em>Bulk mail</em>} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Spam');
    expect(screen.getByText('Bulk mail').tagName).toBe('EM');
  });

  it('lets a caller override the layout it sets with a style prop of their own', () => {
    renderButton(
      <ReportButton data-testid="report" variant="spam" title="Spam" description="Body" mah="80px" p="xs" />,
    );

    const report = screen.getByTestId('report');

    expect(report.style.maxHeight).toBe('calc(5rem * var(--mantine-scale))');
    expect(report.style.padding).toBe('var(--mantine-spacing-xs)');
  });

  it('forwards props and DOM attributes to the button', () => {
    renderButton(
      <ReportButton className="report" data-testid="report" variant="spam" title="Spam" description="Body" disabled />,
    );

    expect(screen.getByTestId('report')).toHaveClass('report');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
