import { DefaultSupportedLanguage, SupportedLanguages } from '../constants/supported-languages.constants.js';

/**
 * Checks whether a value is a non-empty, non-whitespace-only string.
 *
 * @param i - Value to check.
 * @returns `true` if `i` is a string containing at least one non-whitespace character.
 *
 * @example
 * isFilledString('en-US'); // true
 * isFilledString('   ');   // false
 * isFilledString(undefined); // false
 */
function isFilledString(i: unknown): i is string {
  return typeof i === 'string' && i.trim().length > 0;
}

/**
 * Checks whether a string is one of Minerva's {@link SupportedLanguages} codes.
 *
 * @param i - Lowercase language code to check (e.g. `"en"`, `"de"`).
 * @returns `true` if `i` matches a {@link SupportedLanguages} value.
 *
 * @example
 * isSuppportedLanguage('en'); // true
 * isSuppportedLanguage('jp'); // false
 */
function isSuppportedLanguage(i: string): i is SupportedLanguages {
  const dict: string[] = Object.values(SupportedLanguages);

  return dict.includes(i);
}

/**
 * Resolves an arbitrary language input to one of Minerva's {@link SupportedLanguages}.
 *
 * Accepts IETF BCP-47 language tags such as those returned by `Office.context.displayLanguage`,
 * `Office.context.contentLanguage`, `navigator.language`, or entries of `navigator.languages`
 * (e.g. `"en-US"`, `"fr-FR"`, `"de-DE"`, `"es"`).
 *
 * @see https://www.rfc-editor.org/rfc/rfc4647.html
 * @see https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag
 * @see https://www.iso.org/iso-3166-country-codes.html
 *
 * Resolution order:
 * 1. If `input` is not a non-empty string, returns {@link DefaultSupportedLanguage}.
 * 2. If the trimmed, lowercased value is itself a supported language code, returns it.
 * 3. Otherwise, the primary language subtag (the part before the first `-`) is tried.
 * 4. If nothing matches, returns {@link DefaultSupportedLanguage}.
 *
 * @param input - Raw language tag, typically from OfficeJs or `window.navigator`. May be `unknown`
 * since these sources are not guaranteed to be well-formed at compile time.
 * @returns A {@link SupportedLanguages} value; falls back to {@link DefaultSupportedLanguage}
 * when `input` is missing, empty, or not a recognized/supported language.
 *
 * @example
 * detectSupportedLanguage('en-US'); // SupportedLanguages.English ('en')
 * detectSupportedLanguage('de-DE'); // SupportedLanguages.German ('de')
 * detectSupportedLanguage('FR');    // SupportedLanguages.French ('fr')
 * detectSupportedLanguage('zh-Hans-CN'); // SupportedLanguages.English (fallback, 'zh' unsupported)
 * detectSupportedLanguage(Office.context.displayLanguage);
 * detectSupportedLanguage(window.navigator.language);
 * detectSupportedLanguage(undefined); // SupportedLanguages.English (fallback)
 */
export function detectSupportedLanguage(input: unknown): SupportedLanguages {
  if (!isFilledString(input)) {
    return DefaultSupportedLanguage;
  }

  const value = input.trim().toLowerCase();

  if (isSuppportedLanguage(value)) {
    return value as SupportedLanguages;
  }

  const languageCodeInISO = value.split('-')?.[0];

  if (isFilledString(languageCodeInISO) && isSuppportedLanguage(languageCodeInISO)) {
    return languageCodeInISO as SupportedLanguages;
  }

  return DefaultSupportedLanguage;
}
