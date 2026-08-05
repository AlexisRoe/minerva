import { MinervaThemeProvider } from '@minerva/ui-lib';
import { type RenderResult, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingView } from './loading.view';

function renderView(steps: string[]): RenderResult {
  return render(
    <MinervaThemeProvider>
      <LoadingView steps={steps} />
    </MinervaThemeProvider>,
  );
}

describe('LoadingView', () => {
  it('keeps the pane frame while it waits', () => {
    renderView(['Connecting to Outlook']);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('announces the step it is on', () => {
    renderView(['Connecting to Outlook']);

    expect(screen.getByRole('status')).toHaveTextContent('Connecting to Outlook');
  });

  it('shows the steps it was given rather than a wording of its own', () => {
    renderView(['Connecting to Outlook', 'Reading the message']);

    expect(screen.getAllByText('Connecting to Outlook').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reading the message').length).toBeGreaterThan(0);
  });

  it('still renders the pane when there is nothing to say', () => {
    renderView([]);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });
});
