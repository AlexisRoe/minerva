import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { PageDescription } from './page-description.component';

function renderDescription(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('PageDescription', () => {
  it('renders the title as the top-level heading', () => {
    renderDescription(<PageDescription title="Report" description="What the last run turned up." />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Report');
  });

  it('sizes the h1 like an h3', () => {
    renderDescription(<PageDescription title="Report" description="What the last run turned up." />);

    // Mantine sizes a Title through this variable, so the h3 scale shows up there.
    expect(screen.getByRole('heading', { level: 1 }).style.getPropertyValue('--title-fz')).toBe(
      'var(--mantine-h3-font-size)',
    );
  });

  it('renders the description below the title', () => {
    renderDescription(<PageDescription title="Report" description="What the last run turned up." />);

    const [title, description] = Array.from(screen.getByText('Report').parentElement?.children ?? []);

    expect(title).toHaveTextContent('Report');
    expect(description).toHaveTextContent('What the last run turned up.');
  });

  it('takes nodes as well as strings', () => {
    renderDescription(<PageDescription title={<span>Report</span>} description={<em>Last run</em>} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Report');
    expect(screen.getByText('Last run').tagName).toBe('EM');
  });

  it('holds the two a theme step apart', () => {
    renderDescription(<PageDescription data-testid="page-description" title="Report" description="Body" />);

    // Mantine spaces a Stack through this variable, so the gap shows up there.
    expect(screen.getByTestId('page-description').style.getPropertyValue('--stack-gap')).toBe(
      'var(--mantine-spacing-2xs)',
    );
  });

  it('lets a caller open the block up with a gap of their own', () => {
    renderDescription(<PageDescription data-testid="page-description" title="Report" description="Body" gap="md" />);

    expect(screen.getByTestId('page-description').style.getPropertyValue('--stack-gap')).toBe(
      'var(--mantine-spacing-md)',
    );
  });

  it('lets a caller style override the layout it sets', () => {
    renderDescription(
      <PageDescription data-testid="page-description" title="Report" description="Body" style={{ display: 'grid' }} />,
    );

    expect(screen.getByTestId('page-description')).toHaveStyle({ display: 'grid' });
  });

  it('forwards Box props and DOM attributes to the root', () => {
    renderDescription(
      <PageDescription className="intro" data-testid="page-description" title="Report" description="Body" />,
    );

    expect(screen.getByTestId('page-description')).toHaveClass('intro');
  });
});
