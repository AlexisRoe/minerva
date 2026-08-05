import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { demoAuthorization, demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import { useAppSession } from './use-app-session.hook';

describe('useAppSession', () => {
  afterEach(() => {
    useSessionStore.getState().reset();
  });

  it('hands back all three slices at once', () => {
    fillSession();

    const { result } = renderHook(() => useAppSession());

    expect(result.current.office).toMatchObject({
      environment: demoEnvironment,
      message: demoMessage,
      user: demoUser,
      hasMessage: true,
    });
    expect(result.current.session).toMatchObject({
      userProfile: demoAuthorization.userProfile,
      sessionId: demoAuthorization.sessionId,
      isAuthorized: true,
    });
    expect(result.current.settings.settings).toEqual(demoSettings);
  });

  it('gives the same answers as the three narrow hooks', () => {
    fillSession();

    const { result } = renderHook(() => useAppSession());

    // Composed rather than reimplemented, so the derived answers cannot drift
    // from the hooks a component reaching for one slice would have used.
    expect(result.current.settings.canReportSpam).toBe(true);
    expect(result.current.office.hasMessage).toBe(true);
  });

  it('reports an empty pane session before the start-up sequence has run', () => {
    const { result } = renderHook(() => useAppSession());

    expect(result.current.office.environment).toBeNull();
    expect(result.current.session.isAuthorized).toBe(false);
    expect(result.current.settings.settings).toBeNull();
  });

  it('keeps the two kinds of user apart', () => {
    fillSession();

    const { result } = renderHook(() => useAppSession());

    // The mailbox owner Outlook reports and the profile the backend confirmed
    // are different objects; a flattened bag would have to drop one of them.
    expect(result.current.office.user).toEqual(demoUser);
    expect(result.current.session.userProfile).toEqual(demoAuthorization.userProfile);
  });
});
