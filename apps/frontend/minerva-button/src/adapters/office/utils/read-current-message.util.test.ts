import { afterEach, describe, expect, it, vi } from 'vitest';

import { readCurrentMessage } from './read-current-message.util';

/** Installs a minimal `Office` global, the way the host script would. */
function stubOffice(item: Partial<Office.MessageRead> | undefined): void {
  vi.stubGlobal('Office', {
    onReady: () => Promise.resolve({}),
    context: { mailbox: { item } },
  });
}

describe('readCurrentMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('narrows the open item to an OutlookMessage', async () => {
    stubOffice({
      itemId: 'AAMkAD==',
      subject: 'Invoice 2026-0042',
      from: { emailAddress: 'billing@example.com', displayName: 'Billing' },
      dateTimeCreated: new Date('2026-08-03T09:15:00.000Z'),
    } as Partial<Office.MessageRead>);

    expect(await readCurrentMessage()).toEqual({
      id: 'AAMkAD==',
      subject: 'Invoice 2026-0042',
      from: 'billing@example.com',
      receivedAt: '2026-08-03T09:15:00.000Z',
    });
  });

  it('answers with null when the pane is not on a message', async () => {
    stubOffice(undefined);

    expect(await readCurrentMessage()).toBeNull();
  });
});
