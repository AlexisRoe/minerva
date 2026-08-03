import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it } from 'vitest';

import { applyMicrosoftLanguage, changeLanguage, currentLanguage } from './change-language.util';

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE);
});

describe('changeLanguage', () => {
  it('switches the active language', async () => {
    expect(currentLanguage()).toBe(DEFAULT_LANGUAGE);

    await changeLanguage(Languages.French);

    expect(currentLanguage()).toBe(Languages.French);
  });
});

describe('applyMicrosoftLanguage', () => {
  it('converts the host tag and switches to it', async () => {
    await expect(applyMicrosoftLanguage('de-DE')).resolves.toBe(Languages.German);

    expect(currentLanguage()).toBe(Languages.German);
  });

  it('accepts the Windows alternate-sort form', async () => {
    await expect(applyMicrosoftLanguage('es-ES_tradnl')).resolves.toBe(Languages.Spanish);
  });

  it('falls back to the default when the host reports nothing usable', async () => {
    await changeLanguage(Languages.German);

    await expect(applyMicrosoftLanguage(undefined)).resolves.toBe(DEFAULT_LANGUAGE);
    expect(currentLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to the default for a language without a catalogue', async () => {
    await expect(applyMicrosoftLanguage('ja-JP')).resolves.toBe(DEFAULT_LANGUAGE);
  });
});
