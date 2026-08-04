import { afterEach, describe, expect, it } from 'vitest';

import { demoAuthorization } from '@/fixtures/demo/minerva.fixture';
import { useSessionStore } from './session.store';

describe('useSessionStore', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('starts empty, before anyone has signed in', () => {
    expect(useSessionStore.getState()).toMatchObject({ authorization: null, flow: null });
  });

  it('records a completed sign-in in one write', () => {
    useSessionStore.getState().setSession({ authorization: demoAuthorization, flow: 'naa' });

    expect(useSessionStore.getState()).toMatchObject({
      authorization: demoAuthorization,
      flow: 'naa',
    });
  });

  it('clears the session on reset', () => {
    useSessionStore.getState().setSession({ authorization: demoAuthorization, flow: 'dialog' });
    useSessionStore.getState().reset();

    expect(useSessionStore.getState()).toMatchObject({ authorization: null, flow: null });
  });

  it('holds no token of any kind', () => {
    useSessionStore.getState().setSession({ authorization: demoAuthorization, flow: 'naa' });

    // The pane's own session is an httpOnly cookie and Graph tokens belong to
    // MSAL, which knows when they expire. A copy here would go stale silently.
    expect(JSON.stringify(useSessionStore.getState())).not.toMatch(/token/i);
  });

  it('does not write itself to storage', () => {
    useSessionStore.getState().setSession({ authorization: demoAuthorization, flow: 'naa' });

    // A session outliving the pane in localStorage is a credential left behind
    // on a shared machine.
    expect(Object.keys(globalThis.localStorage)).not.toContain('session');
    expect(globalThis.localStorage.length).toBe(0);
  });
});
