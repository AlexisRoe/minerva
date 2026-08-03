import { afterEach, describe, expect, it, vi } from 'vitest';

import { readMessageBody } from './read-message-body.util';

describe('readMessageBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks Graph for the body alone and unwraps it', async () => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ body: { contentType: 'text', content: 'Please pay.' } }),
      } as Response),
    );
    vi.stubGlobal('fetch', fetchMock);

    const body = await readMessageBody('AAMkAD==', 'token-123');

    expect(body).toEqual({ contentType: 'text', content: 'Please pay.' });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/messages/AAMkAD==?$select=body'), {
      headers: { Authorization: 'Bearer token-123' },
    });
  });

  it('throws when Graph rejects the call', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: false, status: 403 } as Response));

    await expect(readMessageBody('AAMkAD==', 'token-123')).rejects.toThrow('403');
  });
});
