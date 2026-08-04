import { fireEvent, type RenderResult, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ReportPage } from './report-page.example';

function renderView(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

/** The report buttons carry their description in their name, so they are matched loosely. */
function reportButton(title: RegExp): HTMLElement {
  return screen.getByRole('button', { name: title });
}

describe('ReportPage', () => {
  it('shows the brand logo in the header', () => {
    renderView(<ReportPage />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('shows the page description above the buttons', () => {
    renderView(<ReportPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Report this mail');
  });

  it('offers one button per report', () => {
    renderView(<ReportPage />);

    expect(reportButton(/^Suspicious/)).toBeInTheDocument();
    expect(reportButton(/^Spam/)).toBeInTheDocument();
  });

  it('asks what is wrong before it files anything', async () => {
    const onReport = vi.fn();

    renderView(<ReportPage onReport={onReport} />);
    fireEvent.click(reportButton(/^Suspicious/));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Report as suspicious');
    expect(onReport).not.toHaveBeenCalled();
  });

  it('holds the report back while the mandatory reasons are unanswered', async () => {
    renderView(<ReportPage />);
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');

    expect(screen.getByRole('button', { name: 'Send the report' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));

    expect(screen.getByRole('button', { name: 'Send the report' })).toBeEnabled();
  });

  it('files the report with the variant and everything the drawer collected', async () => {
    const onReport = vi.fn();

    renderView(<ReportPage onReport={onReport} />);
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'The address is not one of ours.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send the report' }));

    expect(onReport).toHaveBeenCalledWith('suspicious', {
      reasons: ['links'],
      comment: 'The address is not one of ours.',
      isValid: true,
    });
  });

  it('closes the drawer once the report is on its way', async () => {
    renderView(<ReportPage />);
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send the report' }));

    // The panel slides out rather than blinking out, so it is gone a moment later.
    await waitForElementToBeRemoved(screen.queryByRole('dialog'));
  });

  it('lets a report with nothing to pick from go as it stands', async () => {
    const onReport = vi.fn();

    renderView(<ReportPage onReport={onReport} />);
    fireEvent.click(reportButton(/^Spam/));
    await screen.findByRole('dialog');

    expect(screen.queryByRole('checkbox')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Send the report' }));

    expect(onReport).toHaveBeenCalledWith('spam', { reasons: [], comment: '', isValid: true });
  });

  it('files nothing when the drawer is cancelled', async () => {
    const onReport = vi.fn();

    renderView(<ReportPage onReport={onReport} />);
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitForElementToBeRemoved(screen.queryByRole('dialog'));

    expect(onReport).not.toHaveBeenCalled();
  });

  it('opens the next report blank, whatever the last one was left holding', async () => {
    renderView(<ReportPage />);
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('checkbox', { name: 'It asks me to follow a link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(reportButton(/^Suspicious/));
    await screen.findByRole('dialog');

    expect(screen.getByRole('checkbox', { name: 'It asks me to follow a link' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Send the report' })).toBeDisabled();
  });

  it('keeps the details drawer to itself, with its own way out', async () => {
    renderView(<ReportPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Satelite' }));

    const drawer = await screen.findByRole('dialog');

    // `ButtonInfoContent` cases every label it is handed, so the one given as
    // `Exchange ID` is read back the way it is drawn.
    expect(drawer).toHaveTextContent('Exchange Id');
    expect(screen.queryByRole('button', { name: 'Send the report' })).toBeNull();
  });

  it('fills the taskpane of the window it is shown in', () => {
    renderView(
      <OutlookWindow>
        <ReportPage />
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByRole('heading', { level: 1 }));
  });
});
