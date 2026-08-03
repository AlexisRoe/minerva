import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { WorkItemDraft } from '../minerva.types';
import { useSubmitWorkItem } from './use-submit-work-item.hook';

const { submitWorkItem } = vi.hoisted(() => ({ submitWorkItem: vi.fn() }));

vi.mock('../utils/submit-work-item.util', () => ({ submitWorkItem }));

const draft: WorkItemDraft = {
  messageId: 'AAMkAD==',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  body: 'Please pay.',
};

describe('useSubmitWorkItem', () => {
  it('keeps the receipt of a successful submission', async () => {
    const receipt = { workItemId: 'wi_1', acceptedAt: '2026-08-03T09:20:00.000Z' };
    submitWorkItem.mockResolvedValueOnce(receipt);

    const { result } = renderHook(() => useSubmitWorkItem());
    await act(async () => {
      await result.current.submit(draft);
    });

    await waitFor(() => {
      expect(result.current.receipt).toEqual(receipt);
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('answers with null instead of rejecting when the call fails', async () => {
    submitWorkItem.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useSubmitWorkItem());
    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.submit(draft);
    });

    expect(resolved).toBeNull();
    expect(result.current.receipt).toBeNull();
  });
});
