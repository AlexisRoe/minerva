import { afterEach, describe, expect, it } from 'vitest';

import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoUser } from '@/fixtures/demo/office.fixture';
import { sessionFixture } from '@/fixtures/session.fixture';
import { useSessionStore } from './session.store';

describe('useSessionStore', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('starts empty, before the start-up sequence has run', () => {
    expect(useSessionStore.getState()).toMatchObject({ office: null, auth: null, settings: null });
  });

  it('records the host, the sign-in and the settings in one write', () => {
    const session = sessionFixture();

    useSessionStore.getState().setSession(session);

    expect(useSessionStore.getState()).toMatchObject(session);
  });

  it('leaves no state in which one slice is filled and another is not', () => {
    useSessionStore.getState().setSession(sessionFixture());

    const { office, auth, settings } = useSessionStore.getState();

    // The whole reason the three stores became one: a component that has read
    // the message never has to ask whether the settings arrived.
    expect([office, auth, settings].every((slice) => slice !== null)).toBe(true);
  });

  it('keeps a pane with no open message distinguishable from one not yet started', () => {
    useSessionStore.getState().setSession(
      sessionFixture({
        office: { environment: demoEnvironment, message: null, user: demoUser },
      }),
    );

    // Both leave the message null, so the slice itself is what tells them apart.
    expect(useSessionStore.getState().office?.message ?? null).toBeNull();
    expect(useSessionStore.getState().office?.environment).toEqual(demoEnvironment);
  });

  it('replaces rather than merges, so a removed reporting method really goes', () => {
    useSessionStore.getState().setSession(sessionFixture());
    useSessionStore.getState().setSession(
      sessionFixture({
        settings: { ...demoSettings, reportingMethods: [] },
      }),
    );

    // A merge would leave a report going to an address the tenant has removed.
    expect(useSessionStore.getState().settings?.reportingMethods).toEqual([]);
  });

  it('empties every slice on reset', () => {
    useSessionStore.getState().setSession(sessionFixture());
    useSessionStore.getState().reset();

    expect(useSessionStore.getState()).toMatchObject({ office: null, auth: null, settings: null });
  });

  it('holds no token of any kind', () => {
    useSessionStore.getState().setSession(sessionFixture());

    // The pane's own session is an httpOnly cookie and Graph tokens belong to
    // MSAL, which knows when they expire. A copy here would go stale silently.
    expect(JSON.stringify(useSessionStore.getState())).not.toMatch(/token/i);
  });

  it('does not write itself to storage', () => {
    useSessionStore.getState().setSession(sessionFixture());

    // Mailbox content and a session, either of which outliving the pane in
    // localStorage is something left behind on a shared machine.
    expect(Object.keys(globalThis.localStorage)).not.toContain('session');
    expect(globalThis.localStorage.length).toBe(0);
  });
});
