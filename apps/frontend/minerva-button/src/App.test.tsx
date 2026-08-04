import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { ConfigProvider, configFixture } from './config';
import { demoEnvironment, demoMessage, demoSettings, demoUser } from './demo';
import { useOfficeStore, useSettingsStore } from './store';

// The index route runs the whole start-up sequence before it renders, which
// wants a host, a token and a backend. What is under test here is the wiring
// above it -- providers, router, first screen -- so the sequence is stubbed and
// the stores are filled the way it would leave them; it has its own tests in
// `routing/loaders/report.loader.test.ts`.
vi.mock('./routing/loaders/report.loader', () => ({
  createReportLoader: () => () => Promise.resolve(null),
  createPaneAdapters: () => ({ minerva: {}, graph: {} }),
}));

// Mirrors the bootstrap in `main.tsx`: the app tree runs below a provider, so
// anything that starts calling `useConfig()` keeps rendering here.
function renderApp() {
  useOfficeStore.getState().setOffice({
    environment: demoEnvironment,
    message: demoMessage,
    user: demoUser,
  });
  useSettingsStore.getState().setSettings(demoSettings);

  return render(
    <ConfigProvider config={configFixture}>
      <MinervaThemeProvider>
        <App />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

describe('App', () => {
  afterEach(() => {
    useOfficeStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  it('renders the report page at the default route', async () => {
    renderApp();

    expect(await screen.findByRole('button', { name: /suspicious/i })).toBeInTheDocument();
  });
});
