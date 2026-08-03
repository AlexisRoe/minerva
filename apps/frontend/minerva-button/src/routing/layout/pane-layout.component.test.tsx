import { MinervaThemeProvider } from '@minerva/ui-lib';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { PaneLayout } from './pane-layout.component';

/** Mounts the layout with one child screen, the way the router does. */
function renderLayout() {
  const router = createMemoryRouter([
    { path: '/', Component: PaneLayout, children: [{ index: true, element: <p>screen</p> }] },
  ]);

  return render(
    <MinervaThemeProvider>
      <RouterProvider router={router} />
    </MinervaThemeProvider>,
  );
}

describe('PaneLayout', () => {
  it('renders the active screen while navigation is idle', async () => {
    renderLayout();

    expect(await screen.findByText('screen')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading…')).not.toBeInTheDocument();
  });
});
