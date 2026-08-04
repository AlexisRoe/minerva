import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { changeLanguage } from '@/platform/i18n/utils/change-language.util';
import { useChangeLanguage } from './use-change-language.hook';

// This runs before Testing Library's auto-cleanup, so the hook rendered by the
// test is still mounted and re-renders on the language change -- hence `act`.
afterEach(async () => {
  await act(async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  });
});

describe('useChangeLanguage', () => {
  it('starts in the default language', () => {
    const { result } = renderHook(() => useChangeLanguage());

    expect(result.current.language).toBe(DEFAULT_LANGUAGE);
  });

  it('switches language and re-renders with the new one', async () => {
    const { result } = renderHook(() => useChangeLanguage());

    await act(async () => {
      await result.current.changeLanguage(Languages.Spanish);
    });

    expect(result.current.language).toBe(Languages.Spanish);
  });

  it('switches to the language the Microsoft host reports', async () => {
    const { result } = renderHook(() => useChangeLanguage());

    await act(async () => {
      await result.current.applyMicrosoftLanguage('zh-Hans-CN');
    });

    expect(result.current.language).toBe(Languages.Mandarin);
  });

  it('keeps the callbacks stable across renders', () => {
    const { result, rerender } = renderHook(() => useChangeLanguage());
    const first = result.current;

    rerender();

    expect(result.current.changeLanguage).toBe(first.changeLanguage);
    expect(result.current.applyMicrosoftLanguage).toBe(first.applyMicrosoftLanguage);
  });
});
