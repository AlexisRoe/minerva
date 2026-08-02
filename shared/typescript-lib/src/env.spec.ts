import { describe, expect, it } from 'vitest';

import { MissingEnvVarError, optionalEnv, readPort, requireEnv } from './index';

describe('requireEnv', () => {
  it('returns the value when set', () => {
    expect(requireEnv('SENTRY_DSN', { SENTRY_DSN: 'https://example' })).toBe('https://example');
  });

  it('throws when unset or blank', () => {
    expect(() => requireEnv('SENTRY_DSN', {})).toThrow(MissingEnvVarError);
    expect(() => requireEnv('SENTRY_DSN', { SENTRY_DSN: '  ' })).toThrow(MissingEnvVarError);
  });
});

describe('optionalEnv', () => {
  it('falls back when unset or blank', () => {
    expect(optionalEnv('NODE_ENV', 'development', {})).toBe('development');
    expect(optionalEnv('NODE_ENV', 'development', { NODE_ENV: '' })).toBe('development');
    expect(optionalEnv('NODE_ENV', 'development', { NODE_ENV: 'production' })).toBe('production');
  });
});

describe('readPort', () => {
  it('falls back when unset', () => {
    expect(readPort('PORT', 3000, {})).toBe(3000);
  });

  it('parses a valid port', () => {
    expect(readPort('PORT', 3000, { PORT: '8080' })).toBe(8080);
  });

  it('rejects values outside the valid range', () => {
    expect(() => readPort('PORT', 3000, { PORT: '0' })).toThrow(RangeError);
    expect(() => readPort('PORT', 3000, { PORT: '70000' })).toThrow(RangeError);
    expect(() => readPort('PORT', 3000, { PORT: 'nope' })).toThrow(RangeError);
  });
});
