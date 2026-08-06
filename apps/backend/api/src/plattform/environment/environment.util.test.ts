import { MinervaError } from '@minerva/typescript-lib';
import { Logger } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { EnvironmentValidationError } from '../../domain/errors/environment.errors';
import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';
import { dropBlankValues, flattenValidationErrors, validateEnvironment } from './environment.util';

/** A minimal environment that passes, so each test can break exactly one thing. */
const VALID_ENVIRONMENT = {
  NODE_ENV: 'production',
  LOG_LEVEL: 'warn',
  API_PORT: '3000',
  SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2',
  SENTRY_TRACES_SAMPLE_RATE: '0.25',
} as const;

/** Builds the tree `class-validator` produces, without running it. */
function validationError(property: string, constraints: Record<string, string>, children: ValidationError[] = []) {
  return { property, constraints, children } as ValidationError;
}

describe('dropBlankValues', () => {
  it('keeps values that say something', () => {
    expect(dropBlankValues({ API_PORT: '3000', NODE_ENV: 'test' })).toEqual({ API_PORT: '3000', NODE_ENV: 'test' });
  });

  it('drops the empty strings a template .env and compose interpolation leave behind', () => {
    expect(dropBlankValues({ SENTRY_DSN: '', API_PORT: '3000' })).toEqual({ API_PORT: '3000' });
  });

  it('drops whitespace-only values and trims the rest', () => {
    expect(dropBlankValues({ SENTRY_DSN: '   ', API_PORT: ' 3000 ' })).toEqual({ API_PORT: '3000' });
  });

  it('drops unset and null variables, leaving the service to decide what absence means', () => {
    expect(dropBlankValues({ API_PORT: undefined, LOG_LEVEL: null })).toEqual({});
  });

  it('passes non-string values through untouched', () => {
    expect(dropBlankValues({ SENTRY_TRACES_SAMPLE_RATE: 0, ENABLED: false })).toEqual({
      SENTRY_TRACES_SAMPLE_RATE: 0,
      ENABLED: false,
    });
  });
});

describe('flattenValidationErrors', () => {
  it('returns nothing for no errors', () => {
    expect(flattenValidationErrors([])).toEqual([]);
  });

  it('writes one line per broken rule, prefixed with the variable', () => {
    const errors = [
      validationError('API_PORT', {
        isInt: 'API_PORT must be an integer number',
        min: 'API_PORT must not be less than 1',
      }),
    ];

    expect(flattenValidationErrors(errors)).toEqual([
      'API_PORT: API_PORT must be an integer number',
      'API_PORT: API_PORT must not be less than 1',
    ]);
  });

  it('joins nested properties into a dotted path', () => {
    const errors = [
      validationError('DATABASE', {}, [validationError('PORT', { isInt: 'PORT must be an integer number' })]),
    ];

    expect(flattenValidationErrors(errors)).toEqual(['DATABASE.PORT: PORT must be an integer number']);
  });

  it('survives an error carrying neither constraints nor children', () => {
    expect(flattenValidationErrors([{ property: 'API_PORT' } as ValidationError])).toEqual([]);
  });
});

describe('validateEnvironment', () => {
  let fatal: MockInstance<Logger['fatal']>;

  beforeEach(() => {
    fatal = vi.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('converts every value to the type the schema declares', () => {
    const environment = validateEnvironment({ ...VALID_ENVIRONMENT });

    expect(environment.API_PORT).toBe(3000);
    expect(environment.SENTRY_TRACES_SAMPLE_RATE).toBe(0.25);
    expect(environment.NODE_ENV).toBe(NodeEnvironment.Production);
    expect(environment.LOG_LEVEL).toBe(LogLevel.Warn);
    expect(environment.SENTRY_DSN).toBe('https://key@o1.ingest.sentry.io/2');
  });

  it('accepts an empty environment, leaving every value absent for the service to resolve', () => {
    const environment = validateEnvironment({});

    expect(environment.NODE_ENV).toBeUndefined();
    expect(environment.LOG_LEVEL).toBeUndefined();
    expect(environment.API_PORT).toBeUndefined();
    expect(environment.SENTRY_DSN).toBeUndefined();
    expect(environment.SENTRY_TRACES_SAMPLE_RATE).toBeUndefined();
  });

  it('fills in no defaults of its own', () => {
    const environment = validateEnvironment({ API_PORT: '4401' });

    expect(environment.API_PORT).toBe(4401);
    expect(environment.NODE_ENV).toBeUndefined();
    expect(environment.LOG_LEVEL).toBeUndefined();
    expect(environment.SENTRY_TRACES_SAMPLE_RATE).toBeUndefined();
  });

  it('treats a declared-but-empty variable as unset rather than as an illegal value', () => {
    const environment = validateEnvironment({ API_PORT: '', SENTRY_DSN: '' });

    expect(environment.API_PORT).toBeUndefined();
    expect(environment.SENTRY_DSN).toBeUndefined();
  });

  it('strips the unrelated variables process.env carries', () => {
    const environment = validateEnvironment({ ...VALID_ENVIRONMENT, BE_API_PORT: '4401', HOME: '/root' });

    expect(Object.keys(environment).sort()).toEqual([
      'API_PORT',
      'LOG_LEVEL',
      'NODE_ENV',
      'SENTRY_DSN',
      'SENTRY_TRACES_SAMPLE_RATE',
    ]);
  });

  it('rejects a port that is not a number', () => {
    expect(() => validateEnvironment({ API_PORT: 'localhost' })).toThrow(EnvironmentValidationError);
  });

  it('rejects a port outside the TCP range', () => {
    expect(() => validateEnvironment({ API_PORT: '70000' })).toThrow(EnvironmentValidationError);
  });

  it('rejects a stage it does not know', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'staging' })).toThrow(EnvironmentValidationError);
  });

  it('rejects a log level Nest has no name for -- optional never means lenient', () => {
    expect(() => validateEnvironment({ LOG_LEVEL: 'trace' })).toThrow(EnvironmentValidationError);
  });

  it('rejects a sample rate above 1', () => {
    expect(() => validateEnvironment({ SENTRY_TRACES_SAMPLE_RATE: '2' })).toThrow(EnvironmentValidationError);
  });

  it('rejects a DSN that is not a URL', () => {
    expect(() => validateEnvironment({ SENTRY_DSN: 'not-a-dsn' })).toThrow(EnvironmentValidationError);
  });

  it('accepts a self-hosted DSN without a public tld', () => {
    expect(validateEnvironment({ SENTRY_DSN: 'https://key@sentry-relay/1' }).SENTRY_DSN).toBe(
      'https://key@sentry-relay/1',
    );
  });

  it('carries every problem as its own string in the payload', () => {
    expect.assertions(3);

    try {
      validateEnvironment({ NODE_ENV: 'staging', API_PORT: '70000' });
    } catch (error) {
      expect(MinervaError.is(error)).toBe(true);

      const issues = (error as EnvironmentValidationError).payload?.issues as string[];
      expect(issues).toHaveLength(2);
      expect(issues.map((issue) => issue.split(':')[0]).sort()).toEqual(['API_PORT', 'NODE_ENV']);
    }
  });

  it('names no value in the payload, so a bad DSN is not leaked to Sentry', () => {
    expect.assertions(1);

    try {
      validateEnvironment({ SENTRY_DSN: 'super-secret-but-invalid' });
    } catch (error) {
      const issues = (error as EnvironmentValidationError).payload?.issues as string[];
      expect(issues.join('\n')).not.toContain('super-secret-but-invalid');
    }
  });

  it('logs a heading and then one line per problem, so a failed boot reads top to bottom', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'staging', API_PORT: '70000' })).toThrow();

    expect(fatal).toHaveBeenCalledTimes(3);
    expect(fatal.mock.calls[0]?.[0]).toContain('2 problem(s)');
    expect(fatal.mock.calls[1]?.[0]).toMatch(/^(NODE_ENV|API_PORT): /);
    expect(fatal.mock.calls[2]?.[0]).toMatch(/^(NODE_ENV|API_PORT): /);
  });

  it('says nothing when the environment is valid', () => {
    validateEnvironment({ ...VALID_ENVIRONMENT });

    expect(fatal).not.toHaveBeenCalled();
  });
});
