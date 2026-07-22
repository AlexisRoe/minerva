import { describe, expect, it } from 'vitest';
import { STEP_TRANSLATIONS } from './loading-reel.constants';
import { sortStepsWithMixingLanguages } from './loading-reel.util';

describe('sortStepsWithMixingLanguages', () => {
  const expectedLength = STEP_TRANSLATIONS.en.steps.length;

  it('returns an array with the same length as the source step count', () => {
    const result = sortStepsWithMixingLanguages(STEP_TRANSLATIONS);

    expect(result).toHaveLength(expectedLength);
  });

  it('only contains filled (non-empty) strings', () => {
    const result = sortStepsWithMixingLanguages(STEP_TRANSLATIONS);

    for (const step of result) {
      expect(typeof step).toBe('string');
      expect(step.trim().length).toBeGreaterThan(0);
    }
  });
});
