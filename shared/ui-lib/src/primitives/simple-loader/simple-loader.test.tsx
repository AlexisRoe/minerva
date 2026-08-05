import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { SimpleLoader } from './simple-loader.component';
import classes from './simple-loader.module.css';

function renderLoader(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('SimpleLoader', () => {
  it('says that something is being waited on', () => {
    renderLoader(<SimpleLoader />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('says what is being waited on where it is told', () => {
    renderLoader(<SimpleLoader label="Loading your reports" />);

    expect(screen.getByRole('status', { name: 'Loading your reports' })).toBeInTheDocument();
  });

  it('draws itself from the stylesheet rather than from anything under it', () => {
    renderLoader(<SimpleLoader />);

    const loader = screen.getByRole('status');

    expect(loader).toHaveClass(classes.loader as string);
    expect(loader.children).toHaveLength(0);
  });

  it('sits in the middle of whatever it is put in, across and down', () => {
    renderLoader(<SimpleLoader data-testid="loader" />);

    // Mantine centres through the class rather than through a style, so what is
    // assertable here is that the root is a Center filling the room it is given.
    expect(screen.getByTestId('loader')).toHaveClass('mantine-Center-root');
    expect(screen.getByTestId('loader')).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('passes the Mantine style props through to its root', () => {
    renderLoader(<SimpleLoader className="loading" data-testid="loader" mih={240} />);

    expect(screen.getByTestId('loader')).toHaveClass('loading');
    expect(screen.getByTestId('loader')).toHaveStyle({ minHeight: 'calc(15rem * var(--mantine-scale))' });
  });
});
