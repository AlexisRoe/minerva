import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { NoContentView } from './no-content-view.component';

function renderView(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('NoContentView', () => {
  it('says what there is none of', () => {
    renderView(<NoContentView title="No mail open" />);

    expect(screen.getByText('No mail open')).toBeInTheDocument();
  });

  it('shows the line under it when there is one', () => {
    renderView(<NoContentView title="No mail open" description="Open a message to see it." />);

    expect(screen.getByText('Open a message to see it.')).toBeInTheDocument();
  });

  it('leaves the description out rather than holding room for it', () => {
    const { container } = renderView(<NoContentView title="No mail open" />);

    expect(container.querySelector('.mantine-EmptyState-description')).toBeNull();
  });

  it('marks the state with the struck-through globe', () => {
    const { container } = renderView(<NoContentView title="No mail open" />);

    expect(container.querySelector('svg')).toHaveClass('tabler-icon-world-off');
  });

  it('keeps the icon out of the text, since the title already says it', () => {
    const { container } = renderView(<NoContentView title="No mail open" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws no way out, because this view has none', () => {
    const { container } = renderView(<NoContentView title="No mail open" description="Nothing to do here." />);

    expect(container.querySelector('.mantine-EmptyState-actions')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('centres itself in the room it is given', () => {
    renderView(<NoContentView title="No mail open" data-testid="view" />);

    expect(screen.getByTestId('view')).toHaveAttribute('data-align', 'center');
    expect(screen.getByTestId('view')).toHaveStyle({ justifyContent: 'center', height: '100%' });
  });

  it('passes the rest of the block props through', () => {
    renderView(<NoContentView title="No mail open" data-testid="view" align="left" className="view" />);

    expect(screen.getByTestId('view')).toHaveAttribute('data-align', 'left');
    expect(screen.getByTestId('view')).toHaveClass('view');
  });
});
