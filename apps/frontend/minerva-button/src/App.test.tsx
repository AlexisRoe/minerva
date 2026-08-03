import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { ConfigProvider, configFixture } from './config';

// Mirrors the bootstrap in `main.tsx`: the app tree runs below a provider, so
// anything that starts calling `useConfig()` keeps rendering here.
function renderApp() {
  return render(
    <ConfigProvider config={configFixture}>
      <MinervaThemeProvider>
        <App />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

describe('App', () => {
  it('renders the task pane', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Minerva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send to minerva/i })).toBeInTheDocument();
  });

  it('confirms after submitting', async () => {
    renderApp();

    expect(screen.queryByText('Queued for processing.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /send to minerva/i }));

    expect(screen.getByText('Queued for processing.')).toBeInTheDocument();
  });
});
