import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { OutlookWindow } from '../../../primitives/outlook-window/outlook-window.component';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ConfirmationPage } from './confirmation-page.example';

function renderView(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

describe('ConfirmationPage', () => {
  it('shows the brand logo in the header', () => {
    renderView(<ConfirmationPage />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('thanks the reader for the report that has just gone', () => {
    renderView(<ConfirmationPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Thanks for reporting' })).toBeInTheDocument();
  });

  it('says where the mail itself ended up', () => {
    renderView(<ConfirmationPage />);

    expect(screen.getByText('It has been moved out of your inbox into Deleted Items.')).toBeInTheDocument();
  });

  it('lists what follows from a suspicious report, under a heading of its own', () => {
    renderView(<ConfirmationPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'What happens next' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('says something else for spam, which goes somewhere else', () => {
    renderView(<ConfirmationPage reportedAs="spam" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reported as spam' })).toBeInTheDocument();
    expect(screen.getByText('It has been moved out of your inbox into Junk Email.')).toBeInTheDocument();
  });

  it('has nothing to add about what follows a spam report', () => {
    renderView(<ConfirmationPage reportedAs="spam" />);

    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('offers nothing to press, since the run is over', () => {
    renderView(<ConfirmationPage />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fills the taskpane of the window it is shown in', () => {
    renderView(
      <OutlookWindow>
        <ConfirmationPage />
      </OutlookWindow>,
    );

    expect(screen.getByRole('complementary')).toContainElement(screen.getByRole('heading', { level: 1 }));
  });
});
