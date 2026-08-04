import { Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '../config/config.fixture';
import { demoSettings } from '../demo';
import { createAdapters } from './create-adapters.util';

const getToken = () => Promise.resolve('graph-token');

describe('createAdapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers from fixtures without touching the network in demo mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { minerva, graph } = createAdapters({ ...configFixture, demo: true }, getToken);

    await expect(minerva.getSettings({ userLanguage: Languages.English })).resolves.toEqual(demoSettings);
    await expect(graph.getMimeMessage('AAMkAD==')).resolves.toBeInstanceOf(Blob);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never sends real mail or moves a real message in demo mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { graph } = createAdapters({ ...configFixture, demo: true }, getToken);

    // These two have side effects a walkthrough must not cause: mail landing in
    // front of a security team, and a message moving out of a real mailbox.
    await graph.sendMail({ to: 'soc@contoso.example', subject: 's', bodyHtml: '', headers: {} });
    await graph.moveMessage('AAMkAD==', 'junkemail');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reaches the network when demo mode is off', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(demoSettings))),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { minerva } = createAdapters({ ...configFixture, demo: false }, getToken);

    await minerva.getSettings({ userLanguage: Languages.English });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never acquires a token in demo mode', async () => {
    const provider = vi.fn(getToken);

    const { graph } = createAdapters({ ...configFixture, demo: true }, provider);
    await graph.getMimeMessage('AAMkAD==');

    // Demo mode has to run where no token can be acquired at all -- a plain
    // browser, outside Outlook -- so the provider must stay untouched.
    expect(provider).not.toHaveBeenCalled();
  });

  it('chooses both adapters together, never one of each', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve(new Response('raw')));
    vi.stubGlobal('fetch', fetchMock);

    const live = createAdapters({ ...configFixture, demo: false }, getToken);
    await live.graph.getMimeMessage('AAMkAD==');

    // A half-demo pane would send real mail about a fixture email; the two sets
    // are picked in one branch precisely so that cannot happen.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
