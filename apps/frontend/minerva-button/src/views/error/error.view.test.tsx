import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider, configFixture } from '../../config';
import { OfficeLoadTimeoutError } from '../../errors';
import { ROUTES } from '../../routing';
import { ErrorView } from './error.view';

const { captureError } = vi.hoisted(() => ({
  captureError: vi.fn(() => 'a1b2c3d4e5f60718293a4b5c6d7e8f90'),
}));

vi.mock('../../sentry', () => ({ captureError }));

/**
 * Mounts a route that throws, so the view is reached the way the router reaches it.
 *
 * A loader rejection is the case that matters: React Router catches those before
 * they can reach a React boundary, which is why this view has to report at all.
 */
function renderThrowing(error: unknown) {
  const router = createMemoryRouter([
    {
      path: ROUTES.taskPane,
      loader: () => {
        throw error;
      },
      element: <p>never rendered</p>,
      errorElement: <ErrorView />,
    },
  ]);

  return render(
    <ConfigProvider config={configFixture}>
      <MinervaThemeProvider>
        <RouterProvider router={router} />
      </MinervaThemeProvider>
    </ConfigProvider>,
  );
}

describe('ErrorView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports a loader failure, which no React boundary would have seen', async () => {
    const error = new OfficeLoadTimeoutError(5000);
    renderThrowing(error);

    await screen.findByText(/could not continue/i);

    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('reports a plain failure too', async () => {
    const error = new Error('the settings endpoint exploded');
    renderThrowing(error);

    await screen.findByText(/could not continue/i);

    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('reports once rather than on every render', async () => {
    renderThrowing(new Error('boom'));

    await screen.findByText(/could not continue/i);

    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('shows the id the report came back with', async () => {
    renderThrowing(new OfficeLoadTimeoutError(5000));

    // What the user quotes has to be what support can search for, which is the
    // Sentry event id -- not the error's `reference`, which names the throw site
    // and is identical for every occurrence.
    expect(await screen.findByText(/a1b2c3d4e5f60718293a4b5c6d7e8f90/)).toBeInTheDocument();
  });

  it('shows no throw-site reference in place of an id', async () => {
    const error = new OfficeLoadTimeoutError(5000);
    renderThrowing(error);

    await screen.findByText(/could not continue/i);

    expect(screen.queryByText(new RegExp(error.reference))).not.toBeInTheDocument();
  });
});
