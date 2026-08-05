import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useErrorLogStore } from '@/stores/error-log/error-log.store';
import { useErrorLog } from './use-error-log.hook';

beforeEach(() => {
  localStorage.clear();
  useErrorLogStore.setState({ entries: [] });
});

describe('useErrorLog', () => {
  it('reports an empty log', () => {
    const { result } = renderHook(() => useErrorLog());

    expect(result.current.entries).toEqual([]);
    expect(result.current.hasEntries).toBe(false);
  });

  it('re-renders when an error is logged elsewhere', () => {
    const { result } = renderHook(() => useErrorLog());

    act(() => {
      useErrorLogStore.getState().log(new Error('boom'));
    });

    expect(result.current.hasEntries).toBe(true);
    expect(result.current.entries[0]).toMatchObject({ message: 'boom' });
  });

  it('clears the log', () => {
    useErrorLogStore.getState().log(new Error('boom'));
    const { result } = renderHook(() => useErrorLog());

    act(() => {
      result.current.clear();
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.hasEntries).toBe(false);
  });
});
