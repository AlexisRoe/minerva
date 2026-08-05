/**
 * The configured i18next instance and the catalogues behind it.
 *
 * Split out from the barrel so the provider and the utils can reach the
 * instance without importing `index.ts`, which re-exports them -- that cycle
 * would leave one side undefined at module-evaluation time. Import the barrel,
 * not this file, from anywhere outside the folder.
 *
 * @see {@link https://www.i18next.com/overview/configuration-options} -- every `init` option
 * @see {@link https://react.i18next.com/latest/using-with-hooks} -- `initReactI18next` and the hooks
 * @see {@link https://www.i18next.com/overview/typescript} -- the `CustomTypeOptions` augmentation in `i18next.d.ts`
 */

import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';

/** The single namespace the task pane uses; one screen does not need more. */
export const defaultNS = 'app';

/**
 * Every catalogue, bundled into the entry chunk.
 *
 * Eager bundling is deliberate at this size: eight catalogues of a handful of
 * strings cost less than the request each lazy load would make, and the task
 * pane has to render immediately when Outlook opens it.
 *
 * **Switch to lazy loading once this grows** -- once the catalogues get large or
 * many more languages are added, every user would be paying for seven languages
 * they never see. Then load only {@link DEFAULT_LANGUAGE} up front and fetch the
 * rest on demand: add `i18next-http-backend` (or i18next's `resourcesToBackend`
 * around a dynamic `import()`), serve `locales/{{lng}}.json` as separate assets,
 * and make {@link changeLanguage} await the load before the switch.
 *
 * @see {@link https://www.i18next.com/how-to/add-or-load-translations} -- loading strategies
 * @see {@link https://github.com/i18next/i18next-http-backend} -- the lazy-loading backend
 */
export const resources = {
  [Languages.Arabic]: { [defaultNS]: ar },
  [Languages.Dutch]: { [defaultNS]: nl },
  [Languages.English]: { [defaultNS]: en },
  [Languages.French]: { [defaultNS]: fr },
  [Languages.German]: { [defaultNS]: de },
  [Languages.Mandarin]: { [defaultNS]: zh },
  [Languages.Portuguese]: { [defaultNS]: pt },
  [Languages.Spanish]: { [defaultNS]: es },
} as const;

/** The tags i18next will accept; anything else resolves to the fallback. */
export const supportedLngs = Object.values(Languages);

i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  // Start in the default language rather than guessing from the browser: the
  // task pane runs inside Outlook, whose language is the one that matters, and
  // it is only known once Office.js is ready. `applyMicrosoftLanguage` switches
  // over at that point.
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs,
  // React escapes for us; i18next doing it again mangles anything interpolated.
  interpolation: { escapeValue: false },
});

export default i18next;
