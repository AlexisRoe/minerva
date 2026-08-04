import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { demoAuthorization } from '@/fixtures/demo/minerva.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import { useSession } from './use-session.hook';

describe('useSession', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('reports nobody signed in before the loader has run', () => {
    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({
      userProfile: null,
      flow: null,
      sessionId: null,
      isAuthorized: false,
    });
  });

  it('unpacks the profile and session id once signed in', () => {
    useSessionStore.getState().setSession({ authorization: demoAuthorization, flow: 'naa' });

    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({
      userProfile: demoAuthorization.userProfile,
      flow: 'naa',
      sessionId: demoAuthorization.sessionId,
      isAuthorized: true,
    });
  });

  it('trusts the backend on authorisation rather than inferring it', () => {
    useSessionStore.getState().setSession({
      authorization: { ...demoAuthorization, isAuthorized: false },
      flow: 'naa',
    });

    const { result } = renderHook(() => useSession());

    // The backend can validate a token and still refuse the user. Treating "we
    // got an answer" as "we are allowed in" would make every later call fail.
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.userProfile).toEqual(demoAuthorization.userProfile);
  });
});
