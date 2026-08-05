import { describe, expect, it } from 'vitest';

import { ErrorScreenKind } from './errors.types';

/**
 * The members' *values* are load-bearing in a way the members themselves are
 * not: they were string literals before, so anything persisted, logged or
 * matched against them still reads the raw string. Renaming a member is free;
 * changing its value is not, and nothing else in the app would notice.
 */
describe('ErrorScreenKind', () => {
  it('keeps the values the screens were named by before', () => {
    expect(ErrorScreenKind.Error).toBe('error');
    expect(ErrorScreenKind.NoContent).toBe('no-content');
  });

  it('has exactly the two screens a failure can land on', () => {
    expect(Object.values(ErrorScreenKind)).toEqual(['error', 'no-content']);
  });

  it('cannot be reassigned by a caller that gets hold of it', () => {
    expect(Object.isFrozen(ErrorScreenKind)).toBe(true);
  });
});
