/**
 * Environment helpers shared by the backend services.
 *
 * Both services boot from the same `.env`, so reading and validating variables
 * lives here rather than being duplicated per service.
 */

import { isNonEmptyString, isValidPort } from './validators/validator.utils';

export class MissingEnvVarError extends Error {
  constructor(readonly variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
    this.name = 'MissingEnvVarError';
  }
}

/** Reads a variable, throwing if it is unset or empty. */
export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (!isNonEmptyString(value)) {
    throw new MissingEnvVarError(name);
  }
  return value;
}

/** Reads a variable, falling back to `fallback` if it is unset or empty. */
export function optionalEnv(name: string, fallback: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  return isNonEmptyString(value) ? value : fallback;
}

/** Reads a TCP port, falling back to `fallback` if unset. Throws if not a valid port. */
export function readPort(name: string, fallback: number, env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[name];
  if (!isNonEmptyString(raw)) {
    return fallback;
  }

  const port = Number(raw);
  if (!isValidPort(port)) {
    throw new RangeError(`Environment variable ${name} is not a valid port: ${raw}`);
  }
  return port;
}
