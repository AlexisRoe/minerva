import { afterEach, describe, expect, it, vi } from 'vitest';

import { stubOffice } from '@/fixtures/office.fixture';
import { readCurrentMessage } from './read-current-message.util';

/** The open item, as Office.js reports one. */
function item(overrides: Partial<Office.MessageRead>): Partial<Office.MessageRead> {
  return {
    itemId: 'AAMkAD==',
    subject: '',
    dateTimeCreated: new Date('2026-08-03T09:15:00.000Z'),
    ...overrides,
  } as Partial<Office.MessageRead>;
}

describe('readCurrentMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('narrows the open item to an OutlookMessage', () => {
    stubOffice({
      item: item({
        internetMessageId: '<abc@example.com>',
        subject: 'Invoice 2026-0042',
        from: { emailAddress: 'billing@example.com', displayName: 'Billing' },
      } as Partial<Office.MessageRead>),
    });

    expect(readCurrentMessage()).toEqual({
      id: 'AAMkAD==',
      exchangeId: 'rest(v2.0):AAMkAD==',
      internetMessageId: '<abc@example.com>',
      subject: 'Invoice 2026-0042',
      from: 'billing@example.com',
      receivedAt: '2026-08-03T09:15:00.000Z',
    });
  });

  it('converts the EWS id once, so no Graph call has to remember to', () => {
    stubOffice({ item: item({}) });

    const message = readCurrentMessage();

    expect(message?.exchangeId).not.toBe(message?.id);
    expect(message?.exchangeId).toContain('v2.0');
  });

  it('tolerates a message with no sender and no Message-ID', () => {
    stubOffice({ item: item({ subject: 'Draft' }) });

    expect(readCurrentMessage()).toMatchObject({ from: '', internetMessageId: '' });
  });

  it('answers with null when the pane is not on a message', () => {
    stubOffice({ item: undefined });

    expect(readCurrentMessage()).toBeNull();
  });

  it('fails with ERR_010 when called before the gate has run', () => {
    // No `Office` at all: the CDN tag has not executed, or this was called
    // outside a route that awaits waitForOffice().
    expect(() => readCurrentMessage()).toThrow(
      expect.objectContaining({ code: 'ERR_010', payload: { reader: 'readCurrentMessage' } }),
    );
  });

  it('separates a wiring fault from an ordinary empty pane', () => {
    stubOffice({ hasMailbox: false });

    // No mailbox is the gate having been skipped, and must not be mistaken for
    // the pane simply not being open on a message.
    expect(() => readCurrentMessage()).toThrow(expect.objectContaining({ code: 'ERR_010' }));
  });
});
