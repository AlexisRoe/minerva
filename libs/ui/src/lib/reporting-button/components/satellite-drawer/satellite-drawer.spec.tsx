import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SatelliteDrawer, type SatelliteDrawerProps } from './satellite-drawer';

function renderDrawer(props: Partial<SatelliteDrawerProps> = {}) {
  render(
    <SatelliteDrawer triggerLabel="Open satellite panel" primaryButtonText="Close" {...props}>
      {props.children ?? <p>Body content</p>}
    </SatelliteDrawer>,
  );
}

async function openDrawer() {
  await userEvent.click(screen.getByRole('button', { name: 'Open satellite panel' }));
}

describe('SatelliteDrawer', () => {
  it('renders a default icon-only trigger with an accessible name', () => {
    renderDrawer();

    const trigger = screen.getByRole('button', { name: 'Open satellite panel' });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the body content before the drawer is opened', () => {
    renderDrawer();

    expect(screen.queryByText('Body content')).not.toBeInTheDocument();
  });

  it('opens on trigger click and shows the children content', async () => {
    renderDrawer();
    await openDrawer();

    expect(await screen.findByText('Body content')).toBeInTheDocument();
  });

  it('closes the drawer when the primary button is clicked', async () => {
    renderDrawer();
    await openDrawer();

    expect(await screen.findByText('Body content')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('Body content')).not.toBeInTheDocument());
  });

  it('reflects a custom primaryButtonText on the footer button', async () => {
    renderDrawer({ primaryButtonText: 'Dismiss' });
    await openDrawer();

    expect(await screen.findByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('renders a custom trigger instead of the default satellite button when provided', () => {
    renderDrawer({ trigger: <button type="button">Custom trigger</button> });

    expect(screen.getByRole('button', { name: 'Custom trigger' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open satellite panel' })).not.toBeInTheDocument();
  });
});
