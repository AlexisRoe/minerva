import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { LoadingIndicator } from './loading-indicator.component';

function renderIndicator(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

const steps = ['One', 'Two', 'Three'];

/** The defaults the reel runs on, so the tests can move it by hand. */
const intervalMs = 1800;
const transitionMs = 500;

/** The reel is the only thing kept out of the accessibility tree. */
function reelOf(container: HTMLElement) {
  const viewport = container.querySelector<HTMLElement>('[aria-hidden="true"]');

  if (!viewport) throw new Error('the indicator drew no reel');

  return viewport;
}

/** What the reel is showing is a matter of where it has been moved to. */
function trackOf(container: HTMLElement) {
  const track = reelOf(container).firstElementChild;

  if (!(track instanceof HTMLElement)) throw new Error('the reel has no track');

  return track;
}

/** Lets the reel turn the given number of times, the way waiting would. */
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('LoadingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says it is loading, without being told what it is loading', () => {
    renderIndicator(<LoadingIndicator />);

    expect(screen.getByRole('status')).toHaveTextContent('loading ...');
  });

  it('shows every step it is given', () => {
    renderIndicator(<LoadingIndicator steps={steps} />);

    for (const step of steps) {
      expect(screen.getAllByText(step).length).toBeGreaterThan(0);
    }
  });

  it('draws nothing at all where there is nothing to say', () => {
    const { container } = renderIndicator(<LoadingIndicator steps={[]} />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('announces the step it is on and keeps the reel itself out of the way', () => {
    const { container } = renderIndicator(<LoadingIndicator steps={steps} />);

    expect(screen.getByRole('status')).toHaveTextContent('One');
    expect(reelOf(container)).toBeInTheDocument();
  });

  it('moves on to the next step once the first one has had its time', () => {
    renderIndicator(<LoadingIndicator steps={steps} />);

    wait(intervalMs);

    expect(screen.getByRole('status')).toHaveTextContent('Two');
  });

  it('comes back round to the first step at the end of the list', () => {
    renderIndicator(<LoadingIndicator steps={steps} />);

    wait(intervalMs * steps.length + transitionMs);

    expect(screen.getByRole('status')).toHaveTextContent('One');
  });

  it('leaves the reel where it started once it has come round, so the loop cannot be seen', () => {
    const { container } = renderIndicator(<LoadingIndicator steps={steps} />);

    const start = trackOf(container).style.transform;

    wait(intervalMs * steps.length);
    // The jump back is only booked once the last step has been rendered, so it is
    // waited on in its own turn.
    wait(transitionMs);

    expect(trackOf(container).style.transform).toBe(start);
  });

  it('holds still where there is only one step to show', () => {
    renderIndicator(<LoadingIndicator steps={['Almost ready']} />);

    wait(intervalMs * 3);

    expect(screen.getByRole('status')).toHaveTextContent('Almost ready');
  });

  it('waits the time it is told to before moving on', () => {
    renderIndicator(<LoadingIndicator steps={steps} intervalMs={4000} />);

    wait(intervalMs);

    expect(screen.getByRole('status')).toHaveTextContent('One');

    wait(4000 - intervalMs);

    expect(screen.getByRole('status')).toHaveTextContent('Two');
  });

  it('starts over when it is handed a different list', () => {
    const { rerender } = renderIndicator(<LoadingIndicator steps={steps} />);

    wait(intervalMs);

    rerender(
      <MinervaThemeProvider>
        <LoadingIndicator steps={['Connecting', 'Almost ready']} />
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Connecting');
  });

  it('fills whatever it is put in, and leaves room around the reel', () => {
    const { container } = renderIndicator(<LoadingIndicator className="reel" steps={steps} />);

    const root = container.querySelector<HTMLElement>('.reel');

    expect(root).toHaveStyle({ width: '100%', height: '100%' });
    expect(root?.style.padding).toBe('var(--mantine-spacing-xl)');
  });

  it('sits in the middle of it, across and down', () => {
    const { container } = renderIndicator(<LoadingIndicator className="reel" steps={steps} />);

    // The centring is a `Center`'s own, and lives in its class rather than in a
    // style this component writes.
    expect(container.querySelector('.reel')).toHaveClass('mantine-Center-root');
  });

  it('shows as many rows of the reel as it is asked for', () => {
    const { container } = renderIndicator(<LoadingIndicator steps={steps} visibleRows={5} />);

    // Five rows of the 52px the reel is built on.
    expect(reelOf(container)).toHaveStyle({ height: '260px' });
  });

  it('passes the Mantine style props through to its root', () => {
    const { container } = renderIndicator(<LoadingIndicator className="reel" steps={steps} mt="lg" />);

    expect(container.querySelector('.reel')).toHaveStyle({ marginTop: 'var(--mantine-spacing-lg)' });
  });
});
