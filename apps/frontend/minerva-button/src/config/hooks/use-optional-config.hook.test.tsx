import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { configFixture } from '../config.fixture';
import { ConfigProvider } from '../provider/config.provider';
import { useOptionalConfig } from './use-optional-config.hook';

describe('useOptionalConfig', () => {
  it('hands out the configuration a provider above it published', () => {
    const { result } = renderHook(() => useOptionalConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ConfigProvider config={configFixture}>{children}</ConfigProvider>
      ),
    });

    expect(result.current).toBe(configFixture);
  });

  it('answers null off-provider rather than throwing, unlike useConfig', () => {
    // The whole reason it exists: the error boundary's fallback renders above
    // every provider, and a throw there would take down the screen that is
    // supposed to explain the last one.
    const { result } = renderHook(() => useOptionalConfig());

    expect(result.current).toBeNull();
  });
});
