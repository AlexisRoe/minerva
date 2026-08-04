import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen, waitFor } from '@testing-library/react';
import { Component, type ReactNode, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncLoading, useAsyncData } from './async-loading.component';

/** The smallest boundary that can prove the rethrow reaches one. */
class TestBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  override state = { message: null as string | null };

  static getDerivedStateFromError(error: Error): { message: string } {
    return { message: error.message };
  }

  override render(): ReactNode {
    return this.state.message === null ? this.props.children : <p>caught: {this.state.message}</p>;
  }
}

function Reader(): ReactNode {
  return <p>data: {String(useAsyncData<string>())}</p>;
}

describe('AsyncLoading', () => {
  beforeEach(() => {
    // React logs caught render errors itself; the noise is not the test's.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the steps reel while the loader is running', async () => {
    let resolve: (value: string) => void = () => undefined;
    const loader = (): Promise<string> => new Promise<string>((r) => (resolve = r));

    render(
      <MinervaThemeProvider>
        <AsyncLoading loader={loader}>
          <Reader />
        </AsyncLoading>
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    resolve('ready');
    await screen.findByText('data: ready');
  });

  it('hands the loaded value to its children', async () => {
    const loader = (): Promise<string> => Promise.resolve('settings');

    render(
      <MinervaThemeProvider>
        <AsyncLoading loader={loader}>
          <Reader />
        </AsyncLoading>
      </MinervaThemeProvider>,
    );

    expect(await screen.findByText('data: settings')).toBeInTheDocument();
  });

  it('renders children for a loader that resolves with nothing', async () => {
    const loader = (): Promise<void> => Promise.resolve();

    render(
      <MinervaThemeProvider>
        <AsyncLoading loader={loader}>
          <p>booted</p>
        </AsyncLoading>
      </MinervaThemeProvider>,
    );

    // The start-up loader only has side effects; `undefined` must still count as
    // loaded rather than looking like a missing provider.
    expect(await screen.findByText('booted')).toBeInTheDocument();
  });

  it('rethrows a rejection during render, so an error boundary can catch it', async () => {
    const loader = (): Promise<string> => Promise.reject(new Error('office is not here'));

    render(
      <MinervaThemeProvider>
        <TestBoundary>
          <AsyncLoading loader={loader}>
            <Reader />
          </AsyncLoading>
        </TestBoundary>
      </MinervaThemeProvider>,
    );

    // A promise rejection cannot reach a boundary on its own; this is the only
    // path from an async failure to the pane's error screen.
    expect(await screen.findByText('caught: office is not here')).toBeInTheDocument();
  });

  it('wraps a rejection that is not an Error', async () => {
    const loader = (): Promise<string> => Promise.reject('just a string');

    render(
      <MinervaThemeProvider>
        <TestBoundary>
          <AsyncLoading loader={loader}>
            <Reader />
          </AsyncLoading>
        </TestBoundary>
      </MinervaThemeProvider>,
    );

    expect(await screen.findByText('caught: just a string')).toBeInTheDocument();
  });

  it('runs the loader exactly once under StrictMode', async () => {
    const loader = vi.fn(() => Promise.resolve('once'));

    render(
      <StrictMode>
        <MinervaThemeProvider>
          <AsyncLoading loader={loader}>
            <Reader />
          </AsyncLoading>
        </MinervaThemeProvider>
      </StrictMode>,
    );

    await screen.findByText('data: once');

    // StrictMode runs every effect twice on mount. The reporting loader files a
    // report, so a second run would mean a duplicate in the backend and a second
    // mail to the security team.
    expect(loader).toHaveBeenCalledOnce();
  });

  it('re-runs when it is handed a different loader', async () => {
    const first = vi.fn(() => Promise.resolve('first'));
    const second = vi.fn(() => Promise.resolve('second'));

    const { rerender } = render(
      <MinervaThemeProvider>
        <AsyncLoading loader={first}>
          <Reader />
        </AsyncLoading>
      </MinervaThemeProvider>,
    );

    await screen.findByText('data: first');

    rerender(
      <MinervaThemeProvider>
        <AsyncLoading loader={second}>
          <Reader />
        </AsyncLoading>
      </MinervaThemeProvider>,
    );

    await waitFor(() => {
      expect(second).toHaveBeenCalledOnce();
    });
    expect(await screen.findByText('data: second')).toBeInTheDocument();
  });
});

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws outside an AsyncLoading', () => {
    expect(() => render(<Reader />)).toThrow('useAsyncData must be called inside an <AsyncLoading>');
  });
});
