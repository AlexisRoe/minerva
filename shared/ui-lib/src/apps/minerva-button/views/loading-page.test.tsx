import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { STEP_TRANSLATIONS } from '../loading-indicator/loading-indicator.example';
import { LoadingPage } from './loading-page.example';

function renderView(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

/** The language of any given step is drawn, so a test can only know the set it came from. */
function everyLanguageAt(index: number) {
  return Object.values(STEP_TRANSLATIONS).map((language) => language.steps[index]);
}

describe('LoadingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the brand logo in the header, so the pane looks like itself while it waits', () => {
    renderView(<LoadingPage />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('says what it is waiting on, in one of the languages it knows the step in', () => {
    renderView(<LoadingPage />);

    expect(everyLanguageAt(0)).toContain(screen.getByRole('status').textContent);
  });

  it('works through the steps while the wait goes on', () => {
    renderView(<LoadingPage intervalMs={1000} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(everyLanguageAt(1)).toContain(screen.getByRole('status').textContent);
  });

  it('takes the steps it is given over its own', () => {
    renderView(<LoadingPage steps={['Waking the mailbox']} />);

    expect(screen.getByRole('status')).toHaveTextContent('Waking the mailbox');
  });

  it('offers nothing to press, since there is nothing yet to report on', () => {
    renderView(<LoadingPage />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fills the taskpane of the window it is shown in', () => {
    renderView(
      <OutlookWindow>
        <LoadingPage />
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByRole('status'));
  });
});
