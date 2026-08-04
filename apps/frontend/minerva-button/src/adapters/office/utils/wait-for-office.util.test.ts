import { afterEach, describe, expect, it, vi } from 'vitest';

import { OFFICE_READY_TIMEOUT_MS, waitForOffice } from './wait-for-office.util';

describe('waitForOffice', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('answers with what the host reports once it is ready', async () => {
    const info = { host: 'Outlook', platform: 'OfficeOnline' };
    vi.stubGlobal('Office', { onReady: () => Promise.resolve(info) });

    expect(await waitForOffice()).toBe(info);
  });

  it('waits for the global to appear before asking the host', async () => {
    const info = { host: 'Outlook', platform: 'PC' };
    const pending = waitForOffice();

    // The CDN tag has not executed yet, so nothing is installed on the first
    // few polls -- the wait has to survive that rather than fail immediately.
    await new Promise((resolve) => setTimeout(resolve, 120));
    vi.stubGlobal('Office', { onReady: () => Promise.resolve(info) });

    expect(await pending).toBe(info);
  });

  it('fails with ERR_007 when the global never appears', async () => {
    await expect(waitForOffice(80)).rejects.toMatchObject({
      code: 'ERR_007',
      payload: { timeoutMs: 80 },
    });
  });

  it('fails with ERR_007 when the host never becomes ready', async () => {
    vi.stubGlobal('Office', { onReady: () => new Promise(() => {}) });

    await expect(waitForOffice(80)).rejects.toMatchObject({
      code: 'ERR_007',
      payload: { timeoutMs: 80 },
    });
  });

  it('waits five seconds unless told otherwise', () => {
    expect(OFFICE_READY_TIMEOUT_MS).toBe(5_000);
  });
});
