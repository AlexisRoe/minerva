import { MinervaError } from '@minerva/typescript-lib';
import { describe, expect, it } from 'vitest';

import en from '@/platform/i18n/locales/en.json';
import { errorRegistry, lookupErrorPolicy, UNKNOWN_ERROR_POLICY } from './errors.registry';
import { ErrorScreenKind } from './errors.types';

const entries = Object.entries(errorRegistry);

/** Resolves a dotted catalogue path, so a nested key can be checked like a flat one. */
function catalogueHas(path: string): boolean {
  const leaf = path.split('.').reduce<unknown>((node, part) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<string, unknown>)[part];
  }, en);

  return typeof leaf === 'string';
}

/**
 * Guards the two properties the registry exists to provide: codes and
 * references are unique, and the class filed under a code is the class that
 * actually throws it. Both are easy to break by copying an existing error as a
 * starting point for a new one.
 */
describe('errorRegistry', () => {
  it('registers every error under a well-formed code', () => {
    for (const code of Object.keys(errorRegistry)) {
      expect(code).toMatch(/^ERR_\d{3}$/);
    }
  });

  it('numbers the codes without gaps, so the next free one is obvious', () => {
    expect(Object.keys(errorRegistry)).toEqual(entries.map((_, index) => `ERR_${String(index + 1).padStart(3, '0')}`));
  });

  it.each(entries)('%s throws itself under that code', (code, { error: ErrorClass }) => {
    // Every constructor is arity-tolerant enough to be built with no arguments
    // here; the payload is what differs, and that is not what this asserts.
    const instance = new (ErrorClass as new () => MinervaError)();

    expect(MinervaError.is(instance)).toBe(true);
    expect(instance.code).toBe(code);
  });

  it('gives every error its own reference, so a log line names one throw site', () => {
    const references = entries.map(
      ([, { error: ErrorClass }]) => new (ErrorClass as new () => MinervaError)().reference,
    );

    expect(new Set(references).size).toBe(references.length);
    for (const reference of references) {
      expect(reference).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it('describes each code for whoever meets it in a report', () => {
    for (const [, { description }] of entries) {
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('never offers a retry on a screen that has no button', () => {
    for (const [code, { screen, canRetry }] of entries) {
      if (screen === ErrorScreenKind.NoContent) {
        // NoContentView is the end of the road by ui-lib's design; a `canRetry`
        // here would be a promise the screen cannot keep.
        expect(canRetry, code).toBe(false);
      }
    }
  });

  it('tells every code what to say, from the catalogue', () => {
    for (const [code, { message }] of entries) {
      expect(message.length, code).toBeGreaterThan(0);
      // The type already pins this to a TranslationKey; this catches a key that
      // was renamed in the catalogue and left behind here.
      expect(catalogueHas(message), code).toBe(true);
    }
  });

  it('explains a no-content failure rather than advising about it', () => {
    for (const [code, { screen, message }] of entries) {
      if (screen === ErrorScreenKind.NoContent) {
        // These screens say what is wrong with the environment; an `errors.tips.`
        // string would be advice for a screen that offers nothing to act on.
        expect(message.startsWith('errors.unsupported.'), code).toBe(true);
      }
    }
  });
});

describe('lookupErrorPolicy', () => {
  it('answers for a registered code', () => {
    expect(lookupErrorPolicy('ERR_008')).toMatchObject({
      screen: ErrorScreenKind.NoContent,
      canRetry: false,
    });
  });

  it('falls back rather than returning nothing for an unknown code', () => {
    // A code from a newer build, or from a dependency. Returning `undefined`
    // would leave every caller to invent its own fallback.
    expect(lookupErrorPolicy('ERR_999')).toEqual(UNKNOWN_ERROR_POLICY);
    expect(lookupErrorPolicy('')).toEqual(UNKNOWN_ERROR_POLICY);
  });

  it('errs towards a screen the user can act on', () => {
    expect(UNKNOWN_ERROR_POLICY.screen).toBe(ErrorScreenKind.Error);
    expect(UNKNOWN_ERROR_POLICY.canRetry).toBe(true);
  });
});
