import { afterEach, describe, expect, it, vi } from 'vitest';
import { STEP_TRANSLATIONS } from './loading-indicator.example';
import { mixLanguages, type StepTranslations } from './loading-indicator.util';

/** Two languages saying the same two things, which is the shape the util is for. */
const pair: StepTranslations = {
  en: { rtl: false, steps: ['Connecting', 'Almost ready'] },
  de: { rtl: false, steps: ['Verbindung', 'Fast fertig'] },
};

/** With two languages to draw from, anything under a half is the first and the rest the second. */
const drawsFirst = 0;
const drawsSecond = 0.6;

describe('mixLanguages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns one step for every step of the first language', () => {
    expect(mixLanguages(STEP_TRANSLATIONS)).toHaveLength(STEP_TRANSLATIONS.en?.steps.length ?? 0);
  });

  it('takes every step from one of the languages it was given', () => {
    const known = Object.values(STEP_TRANSLATIONS).flatMap((language) => language.steps);

    for (const step of mixLanguages(STEP_TRANSLATIONS)) {
      expect(known).toContain(step);
    }
  });

  it('keeps the steps in the order they were given, whatever language each lands in', () => {
    vi.spyOn(Math, 'random').mockReturnValue(drawsSecond);

    expect(mixLanguages(pair)).toEqual(['Verbindung', 'Fast fertig']);
  });

  it('draws a language for each step rather than one for the whole list', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(drawsFirst).mockReturnValueOnce(drawsSecond);

    expect(mixLanguages(pair)).toEqual(['Connecting', 'Fast fertig']);
  });

  it('leaves out a step no language has anything to say for', () => {
    const uneven: StepTranslations = { en: { steps: ['Ready', ''] } };

    expect(mixLanguages(uneven)).toEqual(['Ready']);
  });

  it('measures the list against the first language, however long the others are', () => {
    vi.spyOn(Math, 'random').mockReturnValue(drawsFirst);

    const uneven: StepTranslations = {
      en: { steps: ['One', 'Two'] },
      de: { steps: ['Eins', 'Zwei', 'Drei'] },
    };

    expect(mixLanguages(uneven)).toEqual(['One', 'Two']);
  });

  it('has nothing to say about an empty set of translations', () => {
    expect(mixLanguages({})).toEqual([]);
  });

  it('has nothing to say about a language with no steps', () => {
    expect(mixLanguages({ en: { steps: [] } })).toEqual([]);
  });
});
