import {
  convertLanguageTagToInternalLanguage,
  convertMicrosoftLanguagetoInternalLanguage,
  type Languages,
} from '@minerva/typescript-lib';
import i18next from '../i18next.instance';

/**
 * Switches the whole task pane to another language.
 *
 * Every mounted component re-renders with the new catalogue, so this is the only
 * supported way to change language -- never call `i18next.changeLanguage`
 * directly from outside this folder.
 *
 * @param language - The internal language to switch to.
 * @returns A promise that settles once the catalogue is active. It only matters
 * once catalogues are lazily loaded; with everything bundled the switch is
 * already done by the time React re-renders.
 *
 * @see {@link https://www.i18next.com/overview/api#changelanguage}
 *
 * @example
 * ```ts
 * await changeLanguage(Languages.German);
 * ```
 */
export async function changeLanguage(language: Languages): Promise<void> {
  await i18next.changeLanguage(language);
}

/**
 * Switches to the language the Microsoft host reports.
 *
 * The task pane starts in {@link DEFAULT_LANGUAGE} because Outlook's language is
 * not known before Office.js is ready; call this from the `Office.onReady`
 * handler to move to the user's actual language. Anything unusable or without a
 * catalogue lands on {@link DEFAULT_LANGUAGE}, so the value can be passed
 * straight through from the host or Graph without checking it first.
 *
 * @param tag - `Office.context.displayLanguage`, a Graph `preferredLanguage`, or
 * any other Microsoft language field; non-strings are tolerated.
 * @returns The language that ended up active.
 *
 * @see {@link https://learn.microsoft.com/en-us/javascript/api/office/office.context#office-office-context-displaylanguage-member}
 *
 * @example
 * ```ts
 * Office.onReady(() => {
 *   void applyMicrosoftLanguage(Office.context.displayLanguage); // 'de-DE' -> German
 * });
 * ```
 */
export async function applyMicrosoftLanguage(tag: unknown): Promise<Languages> {
  const language = convertMicrosoftLanguagetoInternalLanguage(tag);
  await changeLanguage(language);

  return language;
}

/**
 * The language currently in use.
 *
 * i18next reports whatever tag it resolved to, so it is narrowed back to the
 * internal name space here rather than handed out raw.
 *
 * @returns The active internal language, or {@link DEFAULT_LANGUAGE} before
 * initialisation has run.
 */
export function currentLanguage(): Languages {
  return convertLanguageTagToInternalLanguage(i18next.resolvedLanguage ?? i18next.language);
}
