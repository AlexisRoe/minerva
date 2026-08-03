import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OutlookMessage } from '../office.types';
import { useCurrentMessage } from './use-current-message.hook';

const message: OutlookMessage = {
  id: 'AAMkAD==',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  receivedAt: '2026-08-03T09:15:00.000Z',
};

vi.mock('../utils/read-current-message.util', () => ({
  readCurrentMessage: vi.fn(() => Promise.resolve(message)),
}));

describe('useCurrentMessage', () => {
  it('starts loading and settles on the open message', async () => {
    const { result } = renderHook(() => useCurrentMessage());

    expect(result.current).toEqual({ message: null, isLoading: true });

    await waitFor(() => {
      expect(result.current).toEqual({ message, isLoading: false });
    });
  });
});
