import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ReportButton } from '../report-button/report-button.component';
import { ReportButtonList } from './report-button-list.component';

function renderList(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ReportButtonList', () => {
  it('renders its buttons in the order they are given', () => {
    const { container } = renderList(
      <ReportButtonList>
        <ReportButton variant="suspicious" title="Suspicious" description="Looks off." />
        <ReportButton variant="spam" title="Spam" description="Bulk mail." />
      </ReportButtonList>,
    );

    const [first, second] = Array.from(container.querySelectorAll('button'));

    expect(first).toHaveTextContent('Suspicious');
    expect(second).toHaveTextContent('Spam');
  });

  it('stacks them with a theme gap between', () => {
    renderList(<ReportButtonList data-testid="list" />);

    expect(screen.getByTestId('list').style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-md)');
  });

  it('lets a caller open the column up with a gap of their own', () => {
    renderList(<ReportButtonList data-testid="list" gap="xl" />);

    expect(screen.getByTestId('list').style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-xl)');
  });

  it('takes the height of what holds it, so the buttons can share it', () => {
    renderList(<ReportButtonList data-testid="list" />);

    expect(screen.getByTestId('list')).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('leaves each button reporting its own variant', () => {
    const onReport = vi.fn();

    renderList(
      <ReportButtonList>
        <ReportButton variant="suspicious" title="Suspicious" description="Looks off." onReport={onReport} />
        <ReportButton variant="spam" title="Spam" description="Bulk mail." onReport={onReport} />
      </ReportButtonList>,
    );

    for (const button of screen.getAllByRole('button')) {
      button.click();
    }

    expect(onReport.mock.calls).toEqual([['suspicious'], ['spam']]);
  });

  it('lets a caller style override the layout it sets', () => {
    renderList(<ReportButtonList data-testid="list" style={{ gap: '2rem' }} />);

    expect(screen.getByTestId('list')).toHaveStyle({ gap: '2rem' });
  });

  it('forwards Box props and DOM attributes to the root', () => {
    renderList(<ReportButtonList className="reports" data-testid="list" />);

    expect(screen.getByTestId('list')).toHaveClass('reports');
  });
});
