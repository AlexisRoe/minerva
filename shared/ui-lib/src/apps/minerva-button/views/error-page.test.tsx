import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ErrorPage } from './error-page.example';

function renderView(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ErrorPage', () => {
  it('shows the brand logo in the header', () => {
    renderView(<ErrorPage />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('says what went wrong, and what it means', () => {
    renderView(<ErrorPage />);

    expect(screen.getByText('Reporting failed')).toBeInTheDocument();
    expect(screen.getByText('The mail was not sent on, so nothing has been reported.')).toBeInTheDocument();
  });

  it('quotes the references the failure came back with', () => {
    renderView(<ErrorPage />);

    expect(screen.getByText(/^ID: /)).toBeInTheDocument();
    expect(screen.getByText('ErrorCode: ERR_800')).toBeInTheDocument();
  });

  it('offers the retry where it has been given one', () => {
    const onRetry = vi.fn();

    renderView(<ErrorPage onRetry={onRetry} />);
    screen.getByRole('button', { name: 'Try again' }).click();

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('leaves the button out where there is nothing to retry', () => {
    renderView(<ErrorPage />);

    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('carries no action of its own beyond the retry', () => {
    renderView(<ErrorPage onRetry={() => {}} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('fills the taskpane of the window it is shown in', () => {
    renderView(
      <OutlookWindow>
        <ErrorPage />
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByText('Reporting failed'));
  });
});
