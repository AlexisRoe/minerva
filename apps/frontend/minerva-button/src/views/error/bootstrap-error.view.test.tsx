import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BootstrapErrorView } from './bootstrap-error.view';

describe('BootstrapErrorView', () => {
  // Deliberately rendered bare: the boundary this backs sits above every
  // provider in `main.tsx`, so anything it needed from context would be absent
  // at exactly the moment it is drawn.
  it('draws with no provider around it at all', () => {
    render(<BootstrapErrorView />);

    expect(screen.getByText(/could not start/i)).toBeInTheDocument();
  });

  it('is drawn in the pane frame, mark and all', () => {
    render(<BootstrapErrorView />);

    // A crash is still Minerva speaking; a bare paragraph reads as a broken page.
    expect(screen.getByText('Minerva')).toBeInTheDocument();
  });

  it('says what to do about it', () => {
    render(<BootstrapErrorView />);

    expect(screen.getByText(/open the message again/i)).toBeInTheDocument();
  });

  it('offers no retry, because it has no budget to spend', () => {
    render(<BootstrapErrorView />);

    // The retry count lives in a configuration this screen cannot reach, so a
    // button here would reload without limit.
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('quotes no code and no id, having neither', () => {
    render(<BootstrapErrorView />);

    expect(screen.queryByText(/ERR_/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^[0-9a-f]{32}$/)).not.toBeInTheDocument();
  });
});
