import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it } from 'vitest';

import { changeLanguage } from './change-language.util';
import { translate } from './translate.util';

afterEach(async () => {
  await changeLanguage(DEFAULT_LANGUAGE);
});

describe('translate', () => {
  it('reads the active catalogue', async () => {
    expect(translate('submit')).toBe('Send to Minerva');

    await changeLanguage(Languages.German);

    expect(translate('submit')).toBe('An Minerva senden');
  });

  it('serves every catalogue, not just the Latin-script ones', async () => {
    await changeLanguage(Languages.Arabic);
    expect(translate('submit')).toBe('إرسال إلى Minerva');

    await changeLanguage(Languages.Mandarin);
    expect(translate('submit')).toBe('发送给 Minerva');
  });
});
