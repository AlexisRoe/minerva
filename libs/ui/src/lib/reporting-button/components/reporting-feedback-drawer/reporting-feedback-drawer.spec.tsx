import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReportReason } from '../report-reason-list/report-reason-list';
import { ReportingFeedbackDrawer } from './reporting-feedback-drawer';

const reasons: ReportReason[] = [
  { id: 'suspicious-link', label: 'Suspicious link or website' },
  { id: 'impersonation', label: 'Impersonates a person or company' },
];

function renderDrawer(props: Partial<React.ComponentProps<typeof ReportingFeedbackDrawer>> = {}) {
  const onPrimaryAction = vi.fn();
  render(
    <ReportingFeedbackDrawer
      type="suspicious"
      title="What makes this suspicious?"
      reasons={reasons}
      primaryButtonText="Report as Suspicious"
      outlineButtonText="Cancel"
      onPrimaryAction={onPrimaryAction}
      {...props}
    />,
  );
  return { onPrimaryAction };
}

async function openDrawer() {
  await userEvent.click(screen.getByRole('button', { name: 'Report email' }));
}

describe('ReportingFeedbackDrawer', () => {
  it('renders the header title and every reason label once opened', async () => {
    renderDrawer();
    await openDrawer();

    expect(screen.getByText('What makes this suspicious?')).toBeInTheDocument();
    expect(screen.getByText('Suspicious link or website')).toBeInTheDocument();
    expect(screen.getByText('Impersonates a person or company')).toBeInTheDocument();
  });

  it('blocks submit and shows the built-in error when requireReason is true and nothing is selected', async () => {
    const { onPrimaryAction } = renderDrawer({ requireReason: true });
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one reason to continue.');
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it('allows submit with no reason selected when requireReason is false', async () => {
    const { onPrimaryAction } = renderDrawer({ requireReason: false });
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));

    await waitFor(() => expect(onPrimaryAction).toHaveBeenCalledWith({ reasonIds: [], details: '' }));
  });

  it('runs a custom validator only after the built-in check passes, and blocks submit on its error', async () => {
    const validate = vi.fn().mockReturnValue('Please add more detail.');
    const { onPrimaryAction } = renderDrawer({ requireReason: true, validate });
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));
    expect(validate).not.toHaveBeenCalled();
    expect(onPrimaryAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Suspicious link or website'));
    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));

    expect(validate).toHaveBeenCalledWith({ reasonIds: ['suspicious-link'], details: '' });
    expect(screen.getByRole('alert')).toHaveTextContent('Please add more detail.');
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it('submits the trimmed reason ids and details, then closes the drawer', async () => {
    const { onPrimaryAction } = renderDrawer();
    await openDrawer();

    await userEvent.click(screen.getByText('Suspicious link or website'));
    await userEvent.type(screen.getByRole('textbox'), '  extra context  ');
    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));

    await waitFor(() =>
      expect(onPrimaryAction).toHaveBeenCalledWith({ reasonIds: ['suspicious-link'], details: 'extra context' }),
    );
    await waitFor(() => expect(screen.queryByText('What makes this suspicious?')).not.toBeInTheDocument());
  });

  it('closes the drawer via the outline button without calling the primary action', async () => {
    const { onPrimaryAction } = renderDrawer();
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('What makes this suspicious?')).not.toBeInTheDocument());
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it('never blocks submit for an empty textarea, even when requireReason is true', async () => {
    const { onPrimaryAction } = renderDrawer({ requireReason: true });
    await openDrawer();

    await userEvent.click(screen.getByText('Suspicious link or website'));
    await userEvent.click(screen.getByRole('button', { name: 'Report as Suspicious' }));

    await waitFor(() => expect(onPrimaryAction).toHaveBeenCalledWith({ reasonIds: ['suspicious-link'], details: '' }));
  });

  it('renders a default icon-only trigger with an accessible name when no custom trigger is given', () => {
    renderDrawer();

    const trigger = screen.getByRole('button', { name: 'Report email' });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a custom trigger instead of the default button when provided', () => {
    renderDrawer({ trigger: <button type="button">Open custom trigger</button> });

    expect(screen.getByRole('button', { name: 'Open custom trigger' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report email' })).not.toBeInTheDocument();
  });
});
