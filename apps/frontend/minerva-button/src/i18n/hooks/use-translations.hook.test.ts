import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { changeLanguage } from '../utils/change-language.util';
import { useTranslations } from './use-translations.hook';

// This runs before Testing Library's auto-cleanup, so the hook rendered by the
// test is still mounted and re-renders on the language change -- hence `act`.
afterEach(async () => {
  await act(async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  });
});

describe('useTranslations', () => {
  it('translates in the active language and reports it', () => {
    const { result } = renderHook(() => useTranslations());

    expect(result.current.t('title')).toBe('Minerva');
    expect(result.current.t('submit')).toBe('Send to Minerva');
    expect(result.current.language).toBe(Languages.English);
  });

  it('re-renders when the language changes elsewhere', async () => {
    const { result } = renderHook(() => useTranslations());

    await act(async () => {
      await changeLanguage(Languages.German);
    });

    expect(result.current.t('submit')).toBe('An Minerva senden');
    expect(result.current.language).toBe(Languages.German);
  });
});
