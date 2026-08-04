import { renderHook } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ConfigProviderMissingError } from '@/domain/errors/config.errors';
import { configFixture } from '@/fixtures/config.fixture';
import { ConfigProvider } from '@/platform/config/provider/config.provider';
import { useConfig } from './use-config.hook';

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(ConfigProvider, { config: configFixture, children });
}

describe('useConfig', () => {
  it('returns the configuration the provider was given', () => {
    const { result } = renderHook(() => useConfig(), { wrapper });

    expect(result.current).toEqual(configFixture);
  });

  it('throws outside a provider, rather than handing out a partial config', () => {
    expect(() => renderHook(() => useConfig())).toThrow(ConfigProviderMissingError);
  });
});
