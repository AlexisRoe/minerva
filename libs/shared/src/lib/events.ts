import type { HelloEventPayload } from './types.js';

export function createHelloEvent(message: string, source: string): HelloEventPayload {
  return {
    type: 'hello',
    message,
    source,
    occurredAt: new Date().toISOString(),
  };
}

export function isHelloEventPayload(value: unknown): value is HelloEventPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === 'hello' &&
    typeof candidate.message === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.occurredAt === 'string'
  );
}
