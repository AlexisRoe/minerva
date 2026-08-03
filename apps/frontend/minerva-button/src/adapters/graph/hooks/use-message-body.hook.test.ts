import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMessageBody } from './use-message-body.hook';

const { readMessageBody } = vi.hoisted(() => ({
  readMessageBody: vi.fn(() => Promise.resolve({ contentType: 'text' as const, content: 'Please pay.' })),
}));

vi.mock('../utils/read-message-body.util', () => ({ readMessageBody }));

describe('useMessageBody', () => {
  it('stays idle until both the id and the token are known', () => {
    const { result } = renderHook(() => useMessageBody(null, 'token-123'));

    expect(result.current).toEqual({ body: null, isLoading: false });
    expect(readMessageBody).not.toHaveBeenCalled();
  });

  it('fetches the body once both are known', async () => {
    const { result } = renderHook(() => useMessageBody('AAMkAD==', 'token-123'));

    await waitFor(() => {
      expect(result.current.body).toEqual({ contentType: 'text', content: 'Please pay.' });
    });
    expect(result.current.isLoading).toBe(false);
  });
});
