import { Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '@/fixtures/config.fixture';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoUser } from '@/fixtures/demo/office.fixture';
import { createAdapters } from './create-adapters.util';

describe('createAdapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers from fixtures without touching the network in demo mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { office, minerva, graph } = createAdapters({ ...configFixture, demo: true });

    await expect(office.readHost()).resolves.toMatchObject({ user: demoUser });
    await expect(minerva.getSettings({ userLanguage: Languages.English })).resolves.toEqual(demoSettings);
    await expect(graph.getMimeMessage('AAMkAD==')).resolves.toBeInstanceOf(Blob);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never sends real mail or moves a real message in demo mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { graph } = createAdapters({ ...configFixture, demo: true });

    // These two have side effects a walkthrough must not cause: mail landing in
    // front of a security team, and a message moving out of a real mailbox.
    await graph.sendMail({ to: 'soc@contoso.example', subject: 's', bodyHtml: '', headers: {} });
    await graph.moveMessage('AAMkAD==', 'junkemail');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never acquires a token in demo mode', async () => {
    const { office } = createAdapters({ ...configFixture, demo: true });

    // Demo mode has to run where no token can be acquired at all -- a plain
    // browser, outside Outlook -- so this must answer rather than sign in.
    await expect(office.acquireToken()).resolves.toBe('');
  });

  it('reaches the network when demo mode is off', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(demoSettings))),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { minerva } = createAdapters({ ...configFixture, demo: false });

    await minerva.getSettings({ userLanguage: Languages.English });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('chooses all three adapters together, never one of each', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response('raw')));
    vi.stubGlobal('fetch', fetchMock);

    const live = createAdapters({ ...configFixture, demo: false });

    // A half-demo pane would send real mail about a fixture email; the three
    // sets are picked in one branch precisely so that cannot happen. The live
    // Graph adapter asks the live Office adapter for a token, which refuses
    // before the host has been read -- proof the two are the live pair.
    await expect(live.graph.getMimeMessage('AAMkAD==')).rejects.toThrow(expect.objectContaining({ code: 'ERR_010' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
