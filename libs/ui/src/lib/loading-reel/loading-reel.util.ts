import type { STEP_TRANSLATIONS } from './loading-reel.constants';

/**
 * Builds a single list of loading-reel step labels, picking a random language
 * independently for each step so the reel reads as a mix of locales instead
 * of a single language throughout.
 *
 * The number of steps is taken from the first language entry, so callers
 * must supply the same step count for every language (as `STEP_TRANSLATIONS`
 * does). Any step that resolves to a missing or blank translation (e.g. a
 * language with fewer steps than the first entry) is dropped, so the result
 * can be shorter than the source step count if languages are uneven.
 *
 * @param trans - per-language step translations to mix, keyed by language code
 * @returns the mixed-language steps, in step order, with empty/missing entries removed
 */
export function sortStepsWithMixingLanguages(trans: typeof STEP_TRANSLATIONS): string[] {
  const stepsPerLanguage = Object.values(trans);
  const amountLanguages = stepsPerLanguage.length;

  const getRandomIndex = (): number => Math.floor(Math.random() * amountLanguages);

  return Array.from({ length: trans.en.steps.length }, (_, index) => {
    return stepsPerLanguage[getRandomIndex()]?.steps[index] ?? 'unknown';
  });
}
