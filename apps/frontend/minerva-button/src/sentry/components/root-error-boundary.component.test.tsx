import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BOOT_ELEMENT_ID, BOOT_ERROR_ELEMENT_ID, BOOT_ERROR_ID_ELEMENT_ID } from '../../constants/bootstrap.constants';
import { RootErrorBoundary } from './root-error-boundary.component';

const { captureError } = vi.hoisted(() => ({ captureError: vi.fn() }));

vi.mock('../utils/capture-error.util', () => ({ captureError }));

/** A component that throws whatever it is given, during render. */
function Explode({ error }: { error: unknown }): never {
  throw error;
}

/** The splash markup `index.html` ships, as the bootstrap leaves it. */
function mountSplash(): void {
  document.body.innerHTML = `
    <div id="root"></div>
    <div id="${BOOT_ELEMENT_ID}" hidden>
      <div id="${BOOT_ERROR_ELEMENT_ID}" hidden></div>
      <p id="${BOOT_ERROR_ID_ELEMENT_ID}" hidden></p>
    </div>`;
}

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountSplash();
    // React logs caught render errors itself; the noise is not the test's.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children while nothing has thrown', () => {
    render(
      <RootErrorBoundary>
        <p>healthy</p>
      </RootErrorBoundary>,
    );

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(document.getElementById(BOOT_ELEMENT_ID)).toHaveAttribute('hidden');
  });

  it('renders nothing at all once something below has thrown', () => {
    const { container } = render(
      <RootErrorBoundary>
        <Explode error={new Error('the theme provider threw')} />
      </RootErrorBoundary>,
    );

    // The whole point of this boundary: no fallback component, so there is
    // nothing left that can throw a second time and escape to a blank pane.
    expect(container).toBeEmptyDOMElement();
  });

  it('reveals the document’s own failure screen instead', () => {
    render(
      <RootErrorBoundary>
        <Explode error={new Error('the theme provider threw')} />
      </RootErrorBoundary>,
    );

    expect(document.getElementById(BOOT_ELEMENT_ID)).not.toHaveAttribute('hidden');
    expect(document.getElementById(BOOT_ERROR_ELEMENT_ID)).not.toHaveAttribute('hidden');
  });

  it('reports what it caught', () => {
    const error = new Error('the theme provider threw');

    render(
      <RootErrorBoundary>
        <Explode error={error} />
      </RootErrorBoundary>,
    );

    expect(captureError).toHaveBeenCalledWith(error);
  });

  it('puts the event id on screen from the first paint of the failure', () => {
    captureError.mockReturnValue('a1b2c3d4e5f60718293a4b5c6d7e8f90');

    render(
      <RootErrorBoundary>
        <Explode error={new Error('the theme provider threw')} />
      </RootErrorBoundary>,
    );

    // Writing to the document rather than rendering is what buys this: the React
    // fallback below cannot, since it renders once before the report is in.
    expect(document.getElementById(BOOT_ERROR_ID_ELEMENT_ID)).toHaveTextContent('a1b2c3d4e5f60718293a4b5c6d7e8f90');
  });

  it('catches a falsy throw as readily as an Error', () => {
    const { container } = render(
      <RootErrorBoundary>
        <Explode error={undefined} />
      </RootErrorBoundary>,
    );

    // `getDerivedStateFromError` keys off a flag rather than the error itself,
    // so a `throw undefined` cannot read as the healthy state.
    expect(container).toBeEmptyDOMElement();
    expect(document.getElementById(BOOT_ERROR_ELEMENT_ID)).not.toHaveAttribute('hidden');
  });
});
