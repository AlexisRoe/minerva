import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OutlookMessage } from '../office.types';
import { useCurrentMessage } from './use-current-message.hook';

const message: OutlookMessage = {
  id: 'AAMkAD==',
  exchangeId: 'rest:AAMkAD==',
  internetMessageId: '<abc@example.com>',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  receivedAt: '2026-08-03T09:15:00.000Z',
};

// The reader is synchronous now; the waiting it used to do is the hook's, so
// both halves have to be stubbed for the hook to be exercised on its own.
vi.mock('../utils/read-current-message.util', () => ({
  readCurrentMessage: vi.fn(() => message),
}));

vi.mock('../utils/wait-for-office.util', () => ({
  waitForOffice: vi.fn(() => Promise.resolve({ host: 'Outlook', platform: 'OfficeOnline' })),
}));

describe('useCurrentMessage', () => {
  it('starts loading and settles on the open message', async () => {
    const { result } = renderHook(() => useCurrentMessage());

    expect(result.current).toEqual({ message: null, isLoading: true });

    await waitFor(() => {
      expect(result.current).toEqual({ message, isLoading: false });
    });
  });

  it('drops a response that arrives after the pane has moved on', async () => {
    const { result, unmount } = renderHook(() => useCurrentMessage());

    unmount();

    // The pane survives the user selecting another mail, and two reads can
    // resolve out of order; writing state after unmount is a React warning at
    // best and the previous message on screen at worst.
    await waitFor(() => {
      expect(result.current).toEqual({ message: null, isLoading: true });
    });
  });
});
