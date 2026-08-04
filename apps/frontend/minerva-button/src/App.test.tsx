import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { ConfigProvider, configFixture } from './config';

// The first screen the router mounts reads the `Office` global, which does not
// exist outside a host. Only the wiring is under test here, so the adapter is
// stubbed the way it answers when the pane is not on a message.
vi.mock('./adapters/office', () => ({
  useCurrentMessage: () => ({ message: null, isLoading: false }),
}));

// The index route now runs the whole start-up sequence before it renders, which
// wants a host, a token and a backend. What is under test here is the wiring
// above it -- providers, router, first screen -- so the sequence is stubbed; it
// has its own tests in `routing/loaders/report.loader.test.ts`.
vi.mock('./routing/loaders/report.loader', () => ({
  createReportLoader: () => () => Promise.resolve(null),
  createPaneAdapters: () => ({ minerva: {}, graph: {} }),
}));

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
  it('renders the task pane at the default route', async () => {
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Minerva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send to minerva/i })).toBeInTheDocument();
  });
});
