import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { demoAuthorization } from '@/fixtures/demo/minerva.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import { useSession } from './use-session.hook';

describe('useSession', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('reports nobody signed in before the start-up sequence has run', () => {
    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({
      userProfile: null,
      flow: null,
      sessionId: null,
      isAuthorized: false,
    });
  });

  it('unpacks the profile and session id once signed in', () => {
    fillSession();

    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({
      userProfile: demoAuthorization.userProfile,
      flow: 'naa',
      sessionId: demoAuthorization.sessionId,
      isAuthorized: true,
    });
  });

  it('records the dialog flow where the client had no NAA', () => {
    fillSession({ auth: { authorization: demoAuthorization, flow: 'dialog' } });

    const { result } = renderHook(() => useSession());

    expect(result.current.flow).toBe('dialog');
  });

  it('trusts the backend on authorisation rather than inferring it', () => {
    fillSession({
      auth: { authorization: { ...demoAuthorization, isAuthorized: false }, flow: 'naa' },
    });

    const { result } = renderHook(() => useSession());

    // The start-up loader refuses such a session outright, so this can only be
    // written by hand -- but "we got an answer" must still never read as "we are
    // allowed in".
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.userProfile).toEqual(demoAuthorization.userProfile);
  });
});
