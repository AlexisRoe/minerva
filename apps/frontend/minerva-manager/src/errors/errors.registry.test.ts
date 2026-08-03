import { MinervaError } from '@minerva/typescript-lib';
import { describe, expect, it } from 'vitest';

import { errorRegistry } from './errors.registry';

const entries = Object.entries(errorRegistry);

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
});
