import type { ParseKeys } from 'i18next';

import i18next from '../i18next.instance';

/**
 * Every key the catalogues define, checked at compile time.
 *
 * The catalogues are nested, so a key is the dotted path to a leaf --
 * `errors.tips.network`, not `errors`. `ParseKeys` is what walks the English
 * catalogue for those paths; `keyof` would only see the top-level groups.
 *
 * @see {@link https://www.i18next.com/overview/typescript} -- key typing and `CustomTypeOptions`
 */
export type TranslationKey = ParseKeys;

/**
 * The values interpolated into a string's `{{placeholders}}`.
 *
 * Deliberately loose about which keys take which values: i18next can derive that
 * from the catalogue, but only if every translation of a string agrees on its
 * placeholders -- and a translator adding or dropping one would then break the
 * *call site* rather than the catalogue, which is the wrong place to find out.
 * `make verify-i18n` is what checks the catalogues against each other.
 */
export type TranslationValues = Readonly<Record<string, string | number>>;

/** Looks a key up in the active catalogue, filling in any placeholders. */
export type Translator = (key: TranslationKey, values?: TranslationValues) => string;

/**
 * Translates outside React.
 *
 * The hook is unavailable in error boundaries' static fallbacks, in event
 * handlers defined at module scope and in other non-component code; this reads
 * the same instance. It does not re-render anything on a language change, so
 * prefer `useTranslations` wherever a component is available.
 *
 * @param key - A key from the catalogue.
 * @param values - What to fill the string's `{{placeholders}}` with.
 * @returns The string in the active language, falling back to English.
 *
 * @see {@link https://www.i18next.com/overview/api#t}
 * @see {@link https://www.i18next.com/translation-function/interpolation}
 *
 * @example
 * ```tsx
 * <Sentry.ErrorBoundary fallback={<p>{translate('errors.generic.message')}</p>}>
 * ```
 *
 * @example Filling a placeholder
 * ```ts
 * translate('confirmation.notified.ok', { address: 'soc@contoso.example' });
 * ```
 */
export function translate(key: TranslationKey, values?: TranslationValues): string {
  return i18next.t(key, values);
}
