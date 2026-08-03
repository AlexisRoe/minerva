export interface StepTranslation {
  /**
   * Whether the language reads right to left. The reel does not need telling —
   * every row is drawn `dir="auto"`, so the text settles its own direction — but
   * it is part of what a caller knows about a language, and mixing loses it.
   */
  rtl?: boolean;
  /**
   * The loading steps in the order they happen. Every language says the same
   * steps, so the lists line up index for index.
   */
  steps: string[];
}

/** What is known about each language, keyed by its code. */
export type StepTranslations = Record<string, StepTranslation>;

/**
 * @description Flattens a set of per-language step lists into the one list of
 * strings a `LoadingIndicator` takes, drawing a language afresh for each step —
 * so the reel reads as a mix of locales rather than as any one of them, and reads
 * differently every time it is built.
 *
 * The step count is taken from the first language, since every language is meant
 * to say the same steps. A step no language has anything for — an uneven set, a
 * blank entry — is left out rather than shown as a gap, so the list can come back
 * shorter than the language it was measured against.
 *
 * @param translations - the step lists to mix, keyed by language code
 * @returns one step per index, each in a language drawn at random, blanks dropped
 *
 * @example
 * ```tsx
 * const steps = mixLanguages({
 *   en: { steps: ['Connecting to Outlook', 'Almost ready'] },
 *   de: { steps: ['Verbindung zu Outlook wird hergestellt', 'Fast fertig'] },
 * });
 *
 * <LoadingIndicator steps={steps} />
 * ```
 */
export function mixLanguages(translations: StepTranslations): string[] {
  const languages = Object.values(translations);
  const [first] = languages;

  if (!first) return [];

  const drawLanguage = () => languages[Math.floor(Math.random() * languages.length)];

  return first.steps.map((_, index) => drawLanguage()?.steps[index] ?? '').filter((step) => step.trim().length > 0);
}
