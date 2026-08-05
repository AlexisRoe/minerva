import { afterEach, describe, expect, it, vi } from 'vitest';

import { OFFICE_READY_TIMEOUT_MS, POLL_MAX_DELAY_MS } from '@/constants/office-js.constants';
import { waitForOffice } from './wait-for-office.util';

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

  it('fails with ERR_008 when Office loads but reports no host', async () => {
    // What the page opened as an ordinary web page looks like: the global is
    // installed, and the host it names is nobody.
    vi.stubGlobal('Office', { onReady: () => Promise.resolve({ host: null, platform: null }) });

    await expect(waitForOffice(80)).rejects.toMatchObject({ code: 'ERR_008' });
  });

  it('fails with ERR_007, keeping the cause, when onReady rejects outright', async () => {
    const cause = new Error('host refused');
    vi.stubGlobal('Office', { onReady: () => Promise.reject(cause) });

    await expect(waitForOffice(80)).rejects.toMatchObject({ code: 'ERR_007', cause });
  });

  it('drops a host that answers after the deadline rather than settling twice', async () => {
    let release: (info: unknown) => void = () => {};
    vi.stubGlobal('Office', { onReady: () => new Promise((resolve) => (release = resolve)) });

    const rejection = waitForOffice(80).catch((thrown: unknown) => thrown);
    await expect(rejection).resolves.toMatchObject({ code: 'ERR_007' });

    // A late answer must not surface as an unhandled rejection in a pane the
    // user has already been shown the timeout screen for.
    release({ host: 'Outlook', platform: 'PC' });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('leaves no timer behind once the host has answered', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Office', { onReady: () => Promise.resolve({ host: 'Outlook', platform: 'PC' }) });

    await waitForOffice();

    // The deadline timer outlives the resolution unless it is cleared, and it
    // would then reject a promise nobody is holding any more.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits five seconds, and never polls slower than a tenth of a second', () => {
    expect(OFFICE_READY_TIMEOUT_MS).toBe(5_000);
    expect(POLL_MAX_DELAY_MS).toBe(100);
  });
});
