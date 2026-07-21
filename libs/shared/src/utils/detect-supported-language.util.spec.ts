import { describe, expect, it } from 'vitest';
import { SupportedLanguages } from '../constants/supported-languages.constants.js';
import { detectSupportedLanguage } from './detect-supported-language.util.js';

describe('detectSupportedLanguage', () => {
  describe('OfficeJs-style language tags (Office.context.displayLanguage / contentLanguage)', () => {
    it.each([
      ['en-US', SupportedLanguages.English],
      ['de-DE', SupportedLanguages.German],
      ['fr-FR', SupportedLanguages.French],
      ['nl-NL', SupportedLanguages.Dutch],
      ['es-ES', SupportedLanguages.Spanish],
      ['pt-PT', SupportedLanguages.Portugiese],
      ['pt-BR', SupportedLanguages.Portugiese],
    ])('resolves %j to %j', (input, expected) => {
      expect(detectSupportedLanguage(input)).toBe(expected);
    });
  });

  describe('navigator-style language tags (navigator.language / navigator.languages entries)', () => {
    it.each([
      ['en-GB', SupportedLanguages.English],
      ['de-AT', SupportedLanguages.German],
      ['fr-CA', SupportedLanguages.French],
      ['es-MX', SupportedLanguages.Spanish],
    ])('resolves %j to %j', (input, expected) => {
      expect(detectSupportedLanguage(input)).toBe(expected);
    });
  });

  describe('bare language codes', () => {
    it.each([
      ['en', SupportedLanguages.English],
      ['de', SupportedLanguages.German],
      ['fr', SupportedLanguages.French],
      ['nl', SupportedLanguages.Dutch],
      ['es', SupportedLanguages.Spanish],
      ['pt', SupportedLanguages.Portugiese],
    ])('resolves %j to %j', (input, expected) => {
      expect(detectSupportedLanguage(input)).toBe(expected);
    });
  });

  describe('case and whitespace normalization', () => {
    it.each([
      ['EN-US', SupportedLanguages.English],
      ['De-de', SupportedLanguages.German],
      ['  fr-FR  ', SupportedLanguages.French],
      ['ES', SupportedLanguages.Spanish],
    ])('resolves %j to %j', (input, expected) => {
      expect(detectSupportedLanguage(input)).toBe(expected);
    });
  });

  describe('language + script + region tags', () => {
    it('falls back to the primary subtag when it is supported', () => {
      // no direct SupportedLanguages entry uses a script subtag today, but the
      // primary-subtag fallback should still apply consistently
      expect(detectSupportedLanguage('en-Latn-US')).toBe(SupportedLanguages.English);
    });

    it('falls back to the default when the primary subtag is unsupported', () => {
      expect(detectSupportedLanguage('zh-Hans-CN')).toBe(SupportedLanguages.English);
      expect(detectSupportedLanguage('sr-Latn-RS')).toBe(SupportedLanguages.English);
    });
  });

  describe('unsupported languages', () => {
    it.each(['zh-CN', 'ja-JP', 'ru-RU', 'it-IT', 'jp'])('falls back to the default for %j', (input) => {
      expect(detectSupportedLanguage(input)).toBe(SupportedLanguages.English);
    });
  });

  describe('inputs that should not happen but must not throw', () => {
    it.each([undefined, null, '', '   ', 42, true, false, {}, [], () => undefined, Symbol('lang'), NaN, -1])(
      'falls back to the default for %j',
      (input) => {
        expect(detectSupportedLanguage(input)).toBe(SupportedLanguages.English);
      },
    );

    it('falls back to the default for a lone hyphen', () => {
      expect(detectSupportedLanguage('-')).toBe(SupportedLanguages.English);
    });

    it('falls back to the default for a tag starting with a hyphen', () => {
      expect(detectSupportedLanguage('-US')).toBe(SupportedLanguages.English);
    });

    it('still extracts the primary subtag for a trailing hyphen (empty region is ignored)', () => {
      // 'de-'.split('-') => ['de', ''], the primary subtag 'de' is still valid
      expect(detectSupportedLanguage('de-')).toBe(SupportedLanguages.German);
    });
  });
});
