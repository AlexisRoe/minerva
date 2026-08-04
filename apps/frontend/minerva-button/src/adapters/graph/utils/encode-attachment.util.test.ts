import { describe, expect, it } from 'vitest';

import { encodeAttachment } from './encode-attachment.util';

describe('encodeAttachment', () => {
  it('encodes the bytes as base64 with no data-URL prefix', async () => {
    await expect(encodeAttachment(new Blob(['hi']))).resolves.toBe('aGk=');
  });

  it('preserves bytes above 0x7F', async () => {
    // Reading the blob as text would decode it as UTF-8 first and corrupt every
    // high byte, which any non-ASCII subject in the reported mail will contain.
    const bytes = new Uint8Array([0xff, 0xfe, 0x00, 0x41]);

    const encoded = await encodeAttachment(new Blob([bytes]));

    expect(Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))).toEqual(bytes);
  });

  it('round-trips a realistic MIME message unchanged', async () => {
    const mime = 'Subject: Rückfrage zur Rechnung\r\n\r\nGrüße, Ada\r\n';

    const encoded = await encodeAttachment(new Blob([mime], { type: 'message/rfc822' }));
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)));

    expect(decoded).toBe(mime);
  });

  it('answers with an empty string for an empty blob', async () => {
    await expect(encodeAttachment(new Blob([]))).resolves.toBe('');
  });
});
