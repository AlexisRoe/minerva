import { convertLanguageTagToInternalLanguage, type Languages } from '@minerva/typescript-lib';
import { useTranslation } from 'react-i18next';

import type { Translator } from '@/platform/i18n/utils/translate.util';

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
export function useTranslations(): { t: Translator; language: Languages } {
  const { t, i18n } = useTranslation();

  return { t, language: convertLanguageTagToInternalLanguage(i18n.resolvedLanguage ?? i18n.language) };
}
