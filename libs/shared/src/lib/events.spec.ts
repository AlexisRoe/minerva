import { describe, expect, it } from 'vitest';
import { createHelloEvent, isHelloEventPayload } from './events.js';

describe('createHelloEvent', () => {
  it('creates a payload with the given message and source', () => {
    const event = createHelloEvent('hi', 'api');

    expect(event.type).toBe('hello');
    expect(event.message).toBe('hi');
    expect(event.source).toBe('api');
    expect(Date.parse(event.occurredAt)).not.toBeNaN();
  });
});

describe('isHelloEventPayload', () => {
  it('accepts a valid payload', () => {
    expect(isHelloEventPayload(createHelloEvent('hi', 'api'))).toBe(true);
  });

  it.each([null, undefined, 42, 'hello', {}, { type: 'other' }])('rejects %j', (value) => {
    expect(isHelloEventPayload(value)).toBe(false);
  });
});
