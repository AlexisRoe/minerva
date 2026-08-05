import { convertLanguageTagToInternalLanguage, type Languages } from '@minerva/typescript-lib';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

/**
 * The task pane's translation hook.
 *
 * Wraps `react-i18next`'s `useTranslation` so components never import the
 * library themselves. The component re-renders whenever the language changes,
 * so a value read from `t()` is always the active catalogue's.
 *
 * @returns `t` for looking up keys, and `language` for the active language --
 * useful for `dir="rtl"`, date formatting, or telling the backend which language
 * to answer in.
 *
 * @see {@link https://react.i18next.com/latest/usetranslation-hook}
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { t } = useTranslations();
 *   return <Title>{t('report.title')}</Title>;
 * }
 * ```
 */
export function useTranslations(): { t: TFunction<'app', undefined>; language: Languages } {
  const { t, i18n } = useTranslation();

  const convertedLanguage = convertLanguageTagToInternalLanguage(i18n.resolvedLanguage ?? i18n.language);

  return { t, language: convertedLanguage };
}
