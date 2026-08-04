import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it } from 'vitest';

import { changeLanguage } from './change-language.util';
import { translate } from './translate.util';

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE);
});

describe('translate', () => {
  it('reads the active catalogue', async () => {
    expect(translate('back')).toBe('Back');

    await changeLanguage(Languages.German);

    expect(translate('back')).toBe('Zurück');
  });

  it('serves every catalogue, not just the Latin-script ones', async () => {
    await changeLanguage(Languages.Arabic);
    expect(translate('back')).toBe('رجوع');

    await changeLanguage(Languages.Mandarin);
    expect(translate('back')).toBe('返回');
  });
});
