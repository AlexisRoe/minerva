import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { resetStores } from '@/fixtures/stores.fixture';
import { useOffice } from './use-office.hook';

describe('useOffice', () => {
  afterEach(resetStores);

  it('reports nothing open before the start-up sequence has run', () => {
    const { result } = renderHook(() => useOffice());

    expect(result.current).toEqual({
      environment: null,
      message: null,
      user: null,
      hasMessage: false,
    });
  });

  it('reads the host slice the loader recorded', () => {
    fillSession();

    const { result } = renderHook(() => useOffice());

    expect(result.current).toEqual({
      environment: demoEnvironment,
      message: demoMessage,
      user: demoUser,
      hasMessage: true,
    });
  });

  it('reports no message when the pane was not opened on one', () => {
    fillSession({ office: { environment: demoEnvironment, message: null, user: demoUser } });

    const { result } = renderHook(() => useOffice());

    expect(result.current.hasMessage).toBe(false);
    expect(result.current.user).toEqual(demoUser);
  });

  it('hands back nothing but the host, so a view cannot reach the rest through it', () => {
    fillSession();

    const { result } = renderHook(() => useOffice());

    expect(Object.keys(result.current).sort()).toEqual(['environment', 'hasMessage', 'message', 'user']);
  });
});
