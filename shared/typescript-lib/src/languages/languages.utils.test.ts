import { afterEach, describe, expect, it } from 'vitest';

import { Languages } from './available-languages';
import {
  convertLanguageTagToInternalLanguage,
  convertMicrosoftLanguagetoInternalLanguage,
  detectBrowserLanguage,
} from './languages.utils';

/**
 * The suite runs on node, where `navigator` may or may not exist depending on
 * the runtime version, so each case installs the shape it needs and the
 * original descriptor is restored afterwards.
 */
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function stubNavigator(value: unknown): void {
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (originalNavigator === undefined) {
    Reflect.deleteProperty(globalThis, 'navigator');
    return;
  }
  Object.defineProperty(globalThis, 'navigator', originalNavigator);
});

describe('convertLanguageTagToInternalLanguage', () => {
  it('accepts a bare internal tag', () => {
    expect(convertLanguageTagToInternalLanguage('de')).toBe(Languages.German);
    expect(convertLanguageTagToInternalLanguage('ar')).toBe(Languages.Arabic);
    expect(convertLanguageTagToInternalLanguage('nl')).toBe(Languages.Dutch);
  });

  it('drops the region, script and any further subtags', () => {
    expect(convertLanguageTagToInternalLanguage('de-AT')).toBe(Languages.German);
    expect(convertLanguageTagToInternalLanguage('pt-BR')).toBe(Languages.Portuguese);
    expect(convertLanguageTagToInternalLanguage('zh-Hans-CN')).toBe(Languages.Mandarin);
  });

  it('ignores casing, underscores and surrounding whitespace', () => {
    expect(convertLanguageTagToInternalLanguage('FR-CA')).toBe(Languages.French);
    expect(convertLanguageTagToInternalLanguage('es_ES')).toBe(Languages.Spanish);
    expect(convertLanguageTagToInternalLanguage('  De-de  ')).toBe(Languages.German);
  });

  it('falls back to English for a language without a catalogue', () => {
    expect(convertLanguageTagToInternalLanguage('ja-JP')).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage('sv')).toBe(Languages.English);
  });

  it('falls back to English for anything that is not a usable tag', () => {
    expect(convertLanguageTagToInternalLanguage(undefined)).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage(null)).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage('')).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage('   ')).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage('-')).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage(1031)).toBe(Languages.English);
    expect(convertLanguageTagToInternalLanguage({ locale: 'de-DE' })).toBe(Languages.English);
  });
});

describe('detectBrowserLanguage', () => {
  it('takes the first supported entry of the preference list', () => {
    stubNavigator({ languages: ['ja-JP', 'de-AT', 'en-US'], language: 'ja-JP' });

    expect(detectBrowserLanguage()).toBe(Languages.German);
  });

  it('prefers the list over the single value', () => {
    stubNavigator({ languages: ['fr-FR', 'de-DE'], language: 'de-DE' });

    expect(detectBrowserLanguage()).toBe(Languages.French);
  });

  it('reads navigator.language when no list is exposed', () => {
    stubNavigator({ language: 'pt-PT' });

    expect(detectBrowserLanguage()).toBe(Languages.Portuguese);
  });

  it('skips blank entries', () => {
    stubNavigator({ languages: ['', '   ', 'nl-BE'] });

    expect(detectBrowserLanguage()).toBe(Languages.Dutch);
  });

  it('falls back to English when nothing in the list is supported', () => {
    stubNavigator({ languages: ['ja-JP', 'sv-SE'] });

    expect(detectBrowserLanguage()).toBe(Languages.English);
  });

  it('falls back to English when the browser exposes nothing usable', () => {
    stubNavigator({ languages: [], language: undefined });
    expect(detectBrowserLanguage()).toBe(Languages.English);

    stubNavigator(undefined);
    expect(detectBrowserLanguage()).toBe(Languages.English);
  });

  it('reads an explicit source where there is no browser window', () => {
    stubNavigator(undefined);

    expect(detectBrowserLanguage({ languages: ['ja-JP', 'nl-NL'] })).toBe(Languages.Dutch);
    expect(detectBrowserLanguage({ language: 'fr-CA' })).toBe(Languages.French);
    expect(detectBrowserLanguage({})).toBe(Languages.English);
  });

  it('prefers the passed source over the ambient navigator', () => {
    stubNavigator({ languages: ['de-DE'] });

    expect(detectBrowserLanguage({ languages: ['es-ES'] })).toBe(Languages.Spanish);
  });
});

describe('convertMicrosoftLanguagetoInternalLanguage', () => {
  it('accepts the language-REGION form Office.js and Graph document', () => {
    expect(convertMicrosoftLanguagetoInternalLanguage('de-DE')).toBe(Languages.German);
    expect(convertMicrosoftLanguagetoInternalLanguage('en-GB')).toBe(Languages.English);
    expect(convertMicrosoftLanguagetoInternalLanguage('zh-CN')).toBe(Languages.Mandarin);
    expect(convertMicrosoftLanguagetoInternalLanguage('es-ES')).toBe(Languages.Spanish);
    expect(convertMicrosoftLanguagetoInternalLanguage('pt-BR')).toBe(Languages.Portuguese);
  });

  it('accepts a neutral culture with no region', () => {
    expect(convertMicrosoftLanguagetoInternalLanguage('de')).toBe(Languages.German);
    expect(convertMicrosoftLanguagetoInternalLanguage('ar')).toBe(Languages.Arabic);
  });

  it('accepts script and three-part tags', () => {
    expect(convertMicrosoftLanguagetoInternalLanguage('zh-Hans')).toBe(Languages.Mandarin);
    expect(convertMicrosoftLanguagetoInternalLanguage('zh-Hant-TW')).toBe(Languages.Mandarin);
    expect(convertMicrosoftLanguagetoInternalLanguage('nl-BE')).toBe(Languages.Dutch);
  });

  it('accepts the casing Microsoft actually returns', () => {
    expect(convertMicrosoftLanguagetoInternalLanguage('de-de')).toBe(Languages.German);
    expect(convertMicrosoftLanguagetoInternalLanguage('FR-FR')).toBe(Languages.French);
  });

  it('accepts Windows alternate-sort names, which use an underscore', () => {
    // https://learn.microsoft.com/en-us/globalization/locale/other-locale-names
    expect(convertMicrosoftLanguagetoInternalLanguage('es-ES_tradnl')).toBe(Languages.Spanish);
    expect(convertMicrosoftLanguagetoInternalLanguage('zh-CN_stroke')).toBe(Languages.Mandarin);
    expect(convertMicrosoftLanguagetoInternalLanguage('de-DE_phoneb')).toBe(Languages.German);
  });

  it('falls back to English for an unset mailbox language', () => {
    expect(convertMicrosoftLanguagetoInternalLanguage(undefined)).toBe(Languages.English);
    expect(convertMicrosoftLanguagetoInternalLanguage(null)).toBe(Languages.English);
    expect(convertMicrosoftLanguagetoInternalLanguage('')).toBe(Languages.English);
  });

  it('falls back to English for the Microsoft forms it deliberately does not decode', () => {
    // Numeric LCIDs: 1031 is de-DE, but decoding needs the full [MS-LCID] table.
    expect(convertMicrosoftLanguagetoInternalLanguage(1031)).toBe(Languages.English);
    // Office writes 'x-none' where a document has no language set.
    expect(convertMicrosoftLanguagetoInternalLanguage('x-none')).toBe(Languages.English);
    // Pseudo-locale used by Microsoft's own localisation testing builds.
    expect(convertMicrosoftLanguagetoInternalLanguage('qps-ploc')).toBe(Languages.English);
  });
});
