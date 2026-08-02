import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { OutlookWindow } from './outlook-window.component';

function renderWindow(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('OutlookWindow', () => {
  it('renders its children in the taskpane', () => {
    renderWindow(
      <OutlookWindow>
        <p>Taskpane</p>
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByText('Taskpane'));
  });

  it('holds the taskpane between 220px and 350px wide, and 400px tall at the least', () => {
    renderWindow(<OutlookWindow />);

    // Mantine sizes style props in rem off its own scale: 220px, 350px, 400px.
    expect(screen.getByRole('complementary')).toHaveStyle({
      minWidth: 'calc(13.75rem * var(--mantine-scale))',
      maxWidth: 'calc(21.875rem * var(--mantine-scale))',
      minHeight: 'calc(25rem * var(--mantine-scale))',
    });
  });

  it('stays tall enough for a full taskpane with the command bar above it', () => {
    renderWindow(<OutlookWindow data-testid="window" />);

    expect(screen.getByTestId('window')).toHaveStyle({ height: '100%', minHeight: 'calc(400px + 3rem)' });
  });

  it('names the taskpane so it can be reached as a region', () => {
    renderWindow(<OutlookWindow />);

    expect(screen.getByRole('complementary', { name: 'Add-in taskpane' })).toBeInTheDocument();
  });

  it('takes a name of its own for the taskpane', () => {
    renderWindow(<OutlookWindow taskpaneLabel="Report" />);

    expect(screen.getByRole('complementary', { name: 'Report' })).toBeInTheDocument();
  });

  it('draws the mail beside the pane as skeletons, with no copy of its own', () => {
    renderWindow(<OutlookWindow data-testid="window" />);

    expect(screen.getByRole('complementary')).toBeEmptyDOMElement();
    expect(screen.getByTestId('window').textContent).toBe('');
  });

  it('picks one message out of the list as the open mail', () => {
    const { container } = renderWindow(<OutlookWindow />);
    const selected = Array.from(container.querySelectorAll('div')).filter(
      (element) => element.style.background === 'var(--mantine-color-default-hover)',
    );

    expect(selected).toHaveLength(1);
  });

  it('lets a caller style prop override the layout it sets', () => {
    renderWindow(<OutlookWindow data-testid="window" mih={200} />);

    expect(screen.getByTestId('window')).toHaveStyle({ minHeight: 'calc(12.5rem * var(--mantine-scale))' });
  });

  it('forwards Box props and DOM attributes to the root', () => {
    renderWindow(<OutlookWindow className="window" data-testid="window" w={800} />);

    expect(screen.getByTestId('window')).toHaveClass('window');
    expect(screen.getByTestId('window').style.width).toContain('50rem');
  });
});
