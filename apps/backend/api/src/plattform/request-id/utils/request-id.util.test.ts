import { describe, expect, it } from 'vitest';

import { toRequestId } from './request-id.util';

const INCOMING_REQUEST_ID = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31';

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('toRequestId', () => {
  it('keeps the id the caller sent, which is what joins their trace to ours', () => {
    expect(toRequestId(INCOMING_REQUEST_ID)).toBe(INCOMING_REQUEST_ID);
  });

  it('mints one when the caller sent none', () => {
    expect(toRequestId(undefined)).toMatch(UUID_PATTERN);
  });

  it.each(['', '   ', 'not-an-id', '00000000-0000-0000-0000-000000000000'])(
    'mints one rather than honouring %p, so a typo cannot join two traces',
    (value) => {
      expect(toRequestId(value)).toMatch(UUID_PATTERN);
    },
  );
});
