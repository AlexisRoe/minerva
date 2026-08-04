import { convertLanguageTagToInternalLanguage, type Languages } from '@minerva/typescript-lib';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  applyMicrosoftLanguage as applyMicrosoftLanguageTag,
  changeLanguage as setLanguage,
} from '@/platform/i18n/utils/change-language.util';

export interface UseChangeLanguage {
  /** The language currently in use. */
  readonly language: Languages;
  /** Switches to another internal language. */
  readonly changeLanguage: (language: Languages) => Promise<void>;
  /** Switches to whatever language the Microsoft host reports. */
  readonly applyMicrosoftLanguage: (tag: unknown) => Promise<Languages>;
}

/**
 * Changing the language from inside React.
 *
 * The task pane starts in `DEFAULT_LANGUAGE` and switches once Outlook's
 * language is known, so this covers both sides of that: `applyMicrosoftLanguage`
 * for the `Office.onReady` hand-over, `changeLanguage` for a language picker or
 * a stored user preference.
 *
 * `language` comes from the `react-i18next` subscription, so the component
 * re-renders when the language changes -- including when it is changed from
 * somewhere else entirely, which is what makes this different from calling the
 * util directly. The returned callbacks are stable, so they are safe as effect
 * dependencies.
 *
 * @returns The active language and the two switchers.
 *
 * @see {@link https://react.i18next.com/latest/usetranslation-hook#not-using-suspense}
 *
 * @example
 * ```tsx
 * function LanguagePicker() {
 *   const { language, changeLanguage } = useChangeLanguage();
 *   return (
 *     <Select
 *       value={language}
 *       onChange={(next) => void changeLanguage(next as Languages)}
 *       data={Object.values(Languages)}
 *     />
 *   );
 * }
 *
 * // Handing over once the host is ready:
 * const { applyMicrosoftLanguage } = useChangeLanguage();
 * useEffect(() => {
 *   void Office.onReady(() => applyMicrosoftLanguage(Office.context.displayLanguage));
 * }, [applyMicrosoftLanguage]);
 * ```
 */
export function useChangeLanguage(): UseChangeLanguage {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(async (language: Languages) => {
    await setLanguage(language);
  }, []);

  const applyMicrosoftLanguage = useCallback(async (tag: unknown) => applyMicrosoftLanguageTag(tag), []);

  // Read off the subscribed instance rather than the module-level util, so the
  // value is the one this render was triggered by.
  return {
    language: convertLanguageTagToInternalLanguage(i18n.resolvedLanguage ?? i18n.language),
    changeLanguage,
    applyMicrosoftLanguage,
  };
}
