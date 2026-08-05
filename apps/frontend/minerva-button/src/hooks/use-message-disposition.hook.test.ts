import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import { useMessageDisposition } from './use-message-disposition.hook';

const { moveMessage, closePane, captureError } = vi.hoisted(() => ({
  moveMessage: vi.fn((_id: string, _folder: string) => Promise.resolve()),
  closePane: vi.fn(),
  captureError: vi.fn(),
}));

// The hook reaches Graph and the host through the adapter set on the config
// context; handing it fakes here is the whole seam, so nothing else has to be
// mocked to keep this test off the network.
vi.mock('@/platform/config/hooks/use-adapters.hook', () => ({
  useAdapters: () => ({ graph: { moveMessage }, office: { closePane }, minerva: {} }),
}));

vi.mock('@/platform/sentry/utils/capture-error.util', () => ({ captureError }));

describe('useMessageDisposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fillSession({ office: { environment: demoEnvironment, message: demoMessage, user: demoUser } });
  });

  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it.each([
    ['suspicious', 'deleteditems', 'confirmation.disposition.delete'],
    ['spam', 'junkemail', 'confirmation.disposition.spam'],
  ] as const)('sends a %s report to %s', async (reportedAs, folder, labelKey) => {
    const { result } = renderHook(() => useMessageDisposition(reportedAs));

    expect(result.current.labelKey).toBe(labelKey);

    act(() => {
      result.current.dispose();
    });

    await waitFor(() => {
      expect(moveMessage).toHaveBeenCalledWith(demoMessage.exchangeId, folder);
    });
  });

  it('closes the pane only once the mail has actually moved', async () => {
    const { result } = renderHook(() => useMessageDisposition('spam'));

    act(() => {
      result.current.dispose();
    });

    await waitFor(() => {
      expect(closePane).toHaveBeenCalled();
    });
    expect(moveMessage).toHaveBeenCalledBefore(closePane);
  });

  it('keeps the pane open and records the failure when the move fails', async () => {
    moveMessage.mockRejectedValueOnce(new Error('item not found'));

    const { result } = renderHook(() => useMessageDisposition('suspicious'));

    act(() => {
      result.current.dispose();
    });

    // Closing here would let the user believe the mail had gone.
    await waitFor(() => {
      expect(result.current.moveFailed).toBe(true);
    });
    expect(closePane).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalled();
    expect(result.current.isMoving).toBe(false);
  });

  it('clears the last failure when the move is tried again', async () => {
    moveMessage.mockRejectedValueOnce(new Error('item not found'));

    const { result } = renderHook(() => useMessageDisposition('spam'));

    act(() => {
      result.current.dispose();
    });
    await waitFor(() => {
      expect(result.current.moveFailed).toBe(true);
    });

    act(() => {
      result.current.dispose();
    });
    await waitFor(() => {
      expect(result.current.moveFailed).toBe(false);
    });
  });

  it('leaves the mail where it is when the user just closes', () => {
    const { result } = renderHook(() => useMessageDisposition('spam'));

    act(() => {
      result.current.dismiss();
    });

    expect(closePane).toHaveBeenCalled();
    expect(moveMessage).not.toHaveBeenCalled();
  });

  it('does nothing outside a host, where there is no mail to move', () => {
    useSessionStore.getState().reset();

    const { result } = renderHook(() => useMessageDisposition('spam'));

    act(() => {
      result.current.dispose();
    });

    expect(moveMessage).not.toHaveBeenCalled();
    expect(closePane).not.toHaveBeenCalled();
  });
});
