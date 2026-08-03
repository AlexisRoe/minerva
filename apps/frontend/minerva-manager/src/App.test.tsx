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
  it('renders the shell', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Minerva Manager' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('counts refreshes', async () => {
    renderApp();

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(screen.getByText('Refreshed 1 times')).toBeInTheDocument();
  });
});
