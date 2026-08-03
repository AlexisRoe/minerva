/** Minerva internal name space used for i18n translations currently supported */
export enum Languages {
  /** Arabic */
  Arabic = 'ar',
  /** Netherlands/ Dutch */
  Dutch = 'nl',
  /** Represent american English (but consolidate all english language dialecs) */
  English = 'en',
  /** French */
  French = 'fr',
  /** German (Germany, Swizz, Austria and other dialects) */
  German = 'de',
  /** Simple Chinese */
  Mandarin = 'zh',
  /** Portugal and other countries */
  Portuguese = 'pt',
  /** Spain and other countries*/
  Spanish = 'es',
}

/** Default language if user langauge is not supported or detected */
export const DEFAULT_LANGUAGE = Languages.English;
