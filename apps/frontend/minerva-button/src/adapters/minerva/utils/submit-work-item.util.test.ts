import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkItemDraft } from '../minerva.types';
import { submitWorkItem } from './submit-work-item.util';

const draft: WorkItemDraft = {
  messageId: 'AAMkAD==',
  subject: 'Invoice 2026-0042',
  from: 'billing@example.com',
  body: 'Please pay.',
};

describe('submitWorkItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the draft and answers with the receipt', async () => {
    const receipt = { workItemId: 'wi_1', acceptedAt: '2026-08-03T09:20:00.000Z' };
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(receipt) } as Response),
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(await submitWorkItem(draft)).toEqual(receipt);
    expect(fetchMock).toHaveBeenCalledWith('/api/work-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
  });

  it('throws when the API rejects the draft', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: false, status: 500 } as Response));

    await expect(submitWorkItem(draft)).rejects.toThrow('500');
  });
});
