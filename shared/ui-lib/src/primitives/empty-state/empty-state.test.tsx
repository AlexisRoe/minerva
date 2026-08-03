import { IconSearch } from '@tabler/icons-react';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { EmptyState } from './empty-state.component';

function renderState(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('EmptyState', () => {
  it('says what is missing', () => {
    renderState(<EmptyState title="No reports yet" />);

    expect(screen.getByText('No reports yet')).toBeInTheDocument();
  });

  it('shows the description under it when there is one', () => {
    renderState(<EmptyState title="No reports yet" description="Anything you report shows up here." />);

    expect(screen.getByText('Anything you report shows up here.')).toBeInTheDocument();
  });

  it('leaves the description out rather than holding room for it', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('.mantine-EmptyState-description')).toBeNull();
  });

  it('falls back to the inbox icon', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-inbox');
  });

  it('renders the icon it is given instead', () => {
    const { container } = renderState(<EmptyState title="Nothing found" icon={IconSearch} />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-search');
  });

  it('keeps the icon out of the text, since the title already says it', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('puts the icon in the indicator, so it is sized off the block', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('.mantine-EmptyState-indicator > svg')).not.toBeNull();
  });

  it('leaves the icon bare, with nothing drawn behind it', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('.mantine-EmptyState-indicator')).not.toHaveAttribute('data-with-background');
  });

  it('puts the circle back where a variant asks for one', () => {
    const { container } = renderState(<EmptyState title="No reports yet" variant="light" />);

    expect(container.querySelector('.mantine-EmptyState-indicator')).toHaveAttribute('data-with-background');
  });

  it('draws the icon in the primary colour, not the dimmed one', () => {
    renderState(<EmptyState title="No reports yet" data-testid="empty" />);

    expect(screen.getByTestId('empty').style.getPropertyValue('--empty-state-indicator-color')).toBe(
      'var(--mantine-primary-color-filled)',
    );
  });

  it('leaves the colour a variant has already decided alone', () => {
    renderState(<EmptyState title="No reports yet" variant="light" color="red" data-testid="empty" />);

    expect(screen.getByTestId('empty').style.getPropertyValue('--empty-state-indicator-color')).not.toBe(
      'var(--mantine-primary-color-filled)',
    );
  });

  it('draws the icon larger than the size it is given', () => {
    renderState(<EmptyState title="No reports yet" data-testid="empty" />);

    // Mantine sizes the indicator off this one variable, so scaling it carries the icon.
    expect(screen.getByTestId('empty').style.getPropertyValue('--empty-state-indicator-size')).toBe(
      'calc(var(--empty-state-indicator-size-sm) * 1.35)',
    );
  });

  it('shows the action it is given, in the actions block', () => {
    const { container } = renderState(
      <EmptyState title="No reports yet" action={<button type="button">Report this mail</button>} />,
    );

    expect(container.querySelector('.mantine-EmptyState-actions')).toContainElement(
      screen.getByRole('button', { name: 'Report this mail' }),
    );
  });

  it('draws no actions block where it has nothing to put in one', () => {
    const { container } = renderState(<EmptyState title="No reports yet" />);

    expect(container.querySelector('.mantine-EmptyState-actions')).toBeNull();
  });

  it('centres itself in the room it is given', () => {
    renderState(<EmptyState title="No reports yet" data-testid="empty" />);

    // Across is Mantine's own doing, off `align`; down the page is this block's.
    expect(screen.getByTestId('empty')).toHaveAttribute('data-align', 'center');
    expect(screen.getByTestId('empty')).toHaveStyle({ justifyContent: 'center', height: '100%' });
  });

  it('lets a caller style prop override the layout it sets', () => {
    renderState(<EmptyState title="No reports yet" data-testid="empty" h="12rem" />);

    expect(screen.getByTestId('empty')).toHaveStyle({ height: '12rem' });
  });

  it('passes the rest of the Mantine props through', () => {
    renderState(<EmptyState title="No reports yet" data-testid="empty" align="left" className="empty" p={0} />);

    expect(screen.getByTestId('empty')).toHaveAttribute('data-align', 'left');
    expect(screen.getByTestId('empty')).toHaveClass('empty');
  });
});
