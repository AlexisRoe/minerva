import { MinervaError } from '@minerva/typescript-lib';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MinervaErrorBoundary } from './minerva-error-boundary.component';

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn() }));

vi.mock('../utils/capture-error.util', () => ({ captureError }));

/** A component that throws whatever it is given, during render. */
function Explode({ error }: { error: unknown }): never {
  throw error;
}

describe('MinervaErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // React logs caught render errors itself; the noise is not the test's.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children while nothing has thrown', () => {
    render(
      <MinervaErrorBoundary fallback={() => <p>fallback</p>}>
        <p>healthy</p>
      </MinervaErrorBoundary>,
    );

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(captureError).not.toHaveBeenCalled();
  });

  it('swaps in the fallback when a child throws during render', () => {
    render(
      <MinervaErrorBoundary fallback={() => <p>fallback</p>}>
        <Explode error={new Error('render blew up')} />
      </MinervaErrorBoundary>,
    );

    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('hands the error to the fallback, so the screen can branch on it', () => {
    const error = new Error('render blew up');

    render(
      <MinervaErrorBoundary fallback={(caught) => <p>{(caught as Error).message}</p>}>
        <Explode error={error} />
      </MinervaErrorBoundary>,
    );

    // Sentry's own boundary could not do this, which is why this class exists.
    expect(screen.getByText('render blew up')).toBeInTheDocument();
  });

  it('reports what it caught', () => {
    const error = new Error('render blew up');

    render(
      <MinervaErrorBoundary fallback={() => <p>fallback</p>}>
        <Explode error={error} />
      </MinervaErrorBoundary>,
    );

    // Sentry's React integration does not capture render errors on its own, so
    // without this call they would go unreported entirely.
    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('reports a MinervaError as itself, not as something reworded', () => {
    const error = new (class extends MinervaError {
      constructor() {
        super({
          reference: 'd1f0a3c5-8b62-4f1e-9a07-2e5c8b4d6a31',
          code: 'ERR_001',
          message: 'a Minerva failure',
          logLevel: 'error',
          payload: {},
        });
      }
    })();

    render(
      <MinervaErrorBoundary fallback={() => <p>fallback</p>}>
        <Explode error={error} />
      </MinervaErrorBoundary>,
    );

    // `captureError` is what applies the code, reference and fingerprint, so the
    // boundary must hand the error over untouched.
    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('catches a falsy throw as readily as an Error', () => {
    render(
      <MinervaErrorBoundary fallback={() => <p>fallback</p>}>
        <Explode error={0} />
      </MinervaErrorBoundary>,
    );

    // `throw 0` is legal and would slip past a truthiness check on the state.
    expect(screen.getByText('fallback')).toBeInTheDocument();
    expect(captureError).toHaveBeenCalledWith(0);
  });
});
