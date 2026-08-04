import { afterEach, describe, expect, it, vi } from 'vitest';

import { encodeAttachment } from './encode-attachment.util';

describe('encodeAttachment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('rejects rather than hanging when the blob cannot be read', async () => {
    // A promise that never settles here would leave the reporting action stuck
    // mid-flow, with the report filed and no mail sent and no error shown.
    class FailingReader {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      error = new Error('read failed');
      result: string | null = null;

      readAsDataURL(): void {
        queueMicrotask(() => this.onerror?.());
      }
    }

    vi.stubGlobal('FileReader', FailingReader);

    await expect(encodeAttachment(new Blob(['x']))).rejects.toThrow('read failed');
  });

  it('answers with an empty string for a result carrying no payload', async () => {
    class OddReader {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      result = 'not-a-data-url';

      readAsDataURL(): void {
        queueMicrotask(() => this.onload?.());
      }
    }

    vi.stubGlobal('FileReader', OddReader);

    // No comma means no base64 section to slice; returning the whole string would
    // attach garbage to a security team's mail.
    await expect(encodeAttachment(new Blob(['x']))).resolves.toBe('');
  });
});
