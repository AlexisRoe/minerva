import { renderHook } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ConfigProviderMissingError } from '@/domain/errors/config.errors';
import { adaptersFixture } from '@/fixtures/adapters.fixture';
import { configFixture } from '@/fixtures/config.fixture';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { useAdapters } from './use-adapters.hook';

const adapters = adaptersFixture();

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(ConfigProvider, { config: configFixture, adapters, children });
}

describe('useAdapters', () => {
  it('returns the adapter set the provider was given', () => {
    const { result } = renderHook(() => useAdapters(), { wrapper });

    expect(result.current).toBe(adapters);
  });

  it('keeps the same identity across renders, so a memoised loader is not rebuilt', () => {
    const { result, rerender } = renderHook(() => useAdapters(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('throws outside a provider, rather than handing out a half-built set', () => {
    expect(() => renderHook(() => useAdapters())).toThrow(ConfigProviderMissingError);
  });
});
