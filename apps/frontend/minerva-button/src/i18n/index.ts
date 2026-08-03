/**
 * The task pane's i18n adapter.
 *
 * Everything i18next-related lives in this folder and nothing outside it should
 * import `i18next` or `react-i18next` directly. Mount {@link I18nProvider} at
 * the top of the tree; components then read through {@link useTranslations} and
 * switch language through {@link useChangeLanguage}, while code outside React
 * uses {@link translate} and {@link applyMicrosoftLanguage}. Keeping the library
 * behind this surface means a change of i18n engine, of namespace layout or of
 * loading strategy is a change to this folder alone.
 *
 * Importing this module initialises the shared instance as a side effect, so it
 * has to be imported once at start-up and in the test set-up before anything
 * calls `t()`. The instance and the catalogues themselves live in
 * `i18next.instance.ts`.
 *
 * @see {@link https://www.i18next.com/overview/configuration-options} -- every `init` option
 * @see {@link https://react.i18next.com/latest/i18nextprovider} -- the provider
 * @see {@link https://www.i18next.com/overview/typescript} -- the `CustomTypeOptions` augmentation in `i18next.d.ts`
 */

export type { UseChangeLanguage } from './hooks/use-change-language.hook';
export { useChangeLanguage } from './hooks/use-change-language.hook';
export { useTranslations } from './hooks/use-translations.hook';
export { defaultNS, resources, supportedLngs } from './i18next.instance';
export type { I18nProviderProps } from './provider/i18n.provider';
export { I18nProvider } from './provider/i18n.provider';
export { applyMicrosoftLanguage, changeLanguage, currentLanguage } from './utils/change-language.util';
export type { TranslationKey, Translator } from './utils/translate.util';
export { translate } from './utils/translate.util';
