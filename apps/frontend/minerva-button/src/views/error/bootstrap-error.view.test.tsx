import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MinervaRequestFailedError } from '../../errors';
import { BootstrapErrorView } from './bootstrap-error.view';

describe('BootstrapErrorView', () => {
  // Every test renders bare on purpose: the boundary this backs sits above every
  // provider in `main.tsx`, so anything it needed from context would be absent at
  // exactly the moment it is drawn.
  it('draws with no provider around it at all', () => {
    render(<BootstrapErrorView error={new Error('render blew up')} />);

    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('translates off-provider, because the i18next instance is registered globally', () => {
    render(<BootstrapErrorView error={new Error('render blew up')} />);

    // A raw key on screen would be the giveaway that this fell back to nothing.
    expect(screen.queryByText('error-title')).not.toBeInTheDocument();
  });

  it('quotes the code of one of ours, so a crash is as reportable as a loader failure', () => {
    render(<BootstrapErrorView error={new MinervaRequestFailedError('/api/button/settings', 503)} />);

    expect(screen.getByText(/ERR_/)).toBeInTheDocument();
  });

  it('quotes the event id the boundary reported it under', () => {
    render(<BootstrapErrorView error={new Error('render blew up')} errorId="a1b2c3d4e5f60718293a4b5c6d7e8f90" />);

    expect(screen.getByText(/a1b2c3d4e5f60718293a4b5c6d7e8f90/)).toBeInTheDocument();
  });

  it('shows no code for a failure that is not ours', () => {
    render(<BootstrapErrorView error={new TypeError('undefined is not a function')} />);

    // Showing one would invite someone to look up a reference in no registry.
    expect(screen.queryByText(/ERR_/)).not.toBeInTheDocument();
  });

  it('offers no retry, having no budget to spend', () => {
    render(<BootstrapErrorView error={new Error('render blew up')} />);

    // The retry count lives in a configuration that sits below the boundary, so a
    // button here would reload without limit.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
