import i18next, { type resources } from '../i18next.instance';

/** Every key the catalogues define, checked at compile time. */
export type TranslationKey = keyof (typeof resources)['en']['app'];

/** Looks a key up in the active catalogue. */
export type Translator = (key: TranslationKey) => string;

/**
 * Translates outside React.
 *
 * The hook is unavailable in error boundaries' static fallbacks, in event
 * handlers defined at module scope and in other non-component code; this reads
 * the same instance. It does not re-render anything on a language change, so
 * prefer `useTranslations` wherever a component is available.
 *
 * @param key - A key from the catalogue.
 * @returns The string in the active language, falling back to English.
 *
 * @see {@link https://www.i18next.com/overview/api#t}
 *
 * @example
 * ```tsx
 * <Sentry.ErrorBoundary fallback={<p>{translate('error')}</p>}>
 * ```
 */
export function translate(key: TranslationKey): string {
  return i18next.t(key);
}
