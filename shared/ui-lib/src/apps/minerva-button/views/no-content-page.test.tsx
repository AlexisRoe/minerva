import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { NoContentPage } from './no-content-page.example';

function renderView(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('NoContentPage', () => {
  it('shows the brand logo in the header', () => {
    renderView(<NoContentPage />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('says there is nothing open, and what to do about it', () => {
    renderView(<NoContentPage />);

    expect(screen.getByText('No mail open')).toBeInTheDocument();
    expect(screen.getByText('Open a message to see what Minerva makes of it.')).toBeInTheDocument();
  });

  it('offers nothing to press, since there is nothing to report on', () => {
    renderView(<NoContentPage />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fills the taskpane of the window it is shown in', () => {
    renderView(
      <OutlookWindow>
        <NoContentPage />
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByText('No mail open'));
  });
});
