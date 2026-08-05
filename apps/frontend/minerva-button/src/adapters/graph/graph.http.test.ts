import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { GRAPH_BASE_URL, MAX_CUSTOM_HEADERS } from '@/constants/graph-api.constants';
import {
  DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS,
  MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS,
} from '@/constants/request.constants';
import { createGraphHttpAdapter } from './graph.http';
import type { GraphAdapter, NotificationMail } from './graph.types';

const getToken = (): Promise<string> => Promise.resolve('graph-token');

/** Stubs `fetch` with one answer and hands back the spy. */
function stubFetch(
  body: BodyInit,
  status = 200,
): Mock<(_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>> {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(body, { status })),
  );
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** Reads the JSON body of the first recorded call. */
function sentBody(fetchMock: ReturnType<typeof stubFetch>): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;

  return JSON.parse(init.body as string) as Record<string, unknown>;
}

const mail: NotificationMail = {
  to: 'soc@contoso.example',
  subject: 'SUSPICIOUS| Action required',
  bodyHtml: '<p>Reported from Outlook.</p>',
  headers: { 'X-Minerva-Reported-By': 'minerva-button', 'X-Minerva-Report-Id': 'report-1' },
};

describe('createGraphHttpAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getMimeMessage', () => {
    it('downloads $value and re-types it as message/rfc822', async () => {
      // Graph labels the raw bytes text/plain; if that survived, the .eml would
      // attach as a text file rather than as a message.
      const fetchMock = stubFetch(
        new Response('From: a@b.example', { headers: { 'Content-Type': 'text/plain' } }).body ?? 'From: a@b.example',
      );

      const mime = await createGraphHttpAdapter(getToken).getMimeMessage('AAMkAD==');

      expect(mime.type).toBe('message/rfc822');
      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${GRAPH_BASE_URL}/me/messages/AAMkAD%3D%3D/$value`);
    });

    it('sends the bearer token the provider handed over', async () => {
      const fetchMock = stubFetch('raw');

      await createGraphHttpAdapter(getToken).getMimeMessage('AAMkAD==');

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;

      expect(init.headers).toMatchObject({ Authorization: 'Bearer graph-token' });
    });

    it('fails with ERR_012 when the token no longer carries Mail.Read', async () => {
      stubFetch('{}', 403);

      await expect(createGraphHttpAdapter(getToken).getMimeMessage('AAMkAD==')).rejects.toMatchObject({
        code: 'ERR_012',
        payload: { status: 403 },
      });
    });

    it('resolves the token per call, so a long-open pane can refresh it', async () => {
      const tokens = ['first', 'second'];
      const provider = vi.fn(() => Promise.resolve(tokens.shift() ?? 'exhausted'));
      const fetchMock = stubFetch('raw');
      const adapter = createGraphHttpAdapter(provider);

      await adapter.getMimeMessage('one');
      await adapter.getMimeMessage('two');

      // Captured once, the second call would still send `first` -- and a pane can
      // sit open far longer than a token lives.
      expect(provider).toHaveBeenCalledTimes(2);
      const second = fetchMock.mock.calls[1]?.[1] as RequestInit;
      expect(second.headers).toMatchObject({ Authorization: 'Bearer second' });
    });
  });

  describe('sendMail', () => {
    it('builds the message Graph expects', async () => {
      const fetchMock = stubFetch('', 202);

      await createGraphHttpAdapter(getToken).sendMail(mail);

      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${GRAPH_BASE_URL}/me/sendMail`);
      expect(sentBody(fetchMock)).toMatchObject({
        message: {
          subject: 'SUSPICIOUS| Action required',
          body: { contentType: 'HTML', content: '<p>Reported from Outlook.</p>' },
          toRecipients: [{ emailAddress: { address: 'soc@contoso.example' } }],
        },
        saveToSentItems: true,
      });
    });

    it('carries the provenance headers as internetMessageHeaders', async () => {
      const fetchMock = stubFetch('', 202);

      await createGraphHttpAdapter(getToken).sendMail(mail);

      const message = sentBody(fetchMock).message as Record<string, unknown>;

      expect(message.internetMessageHeaders).toEqual([
        { name: 'X-Minerva-Reported-By', value: 'minerva-button' },
        { name: 'X-Minerva-Report-Id', value: 'report-1' },
      ]);
    });

    it('caps the headers, because Graph rejects a sixth outright', async () => {
      const headers = Object.fromEntries(
        Array.from({ length: 8 }, (_value, index) => [`X-Minerva-${index}`, String(index)]),
      );
      const fetchMock = stubFetch('', 202);

      await createGraphHttpAdapter(getToken).sendMail({ ...mail, headers });

      const message = sentBody(fetchMock).message as Record<string, unknown>;

      // Over the limit Graph fails the whole send, so dropping the extras is what
      // keeps one careless header from losing the notification entirely.
      expect(message.internetMessageHeaders).toHaveLength(MAX_CUSTOM_HEADERS);
    });

    it('attaches the original email as base64 with the OData type set', async () => {
      const fetchMock = stubFetch('', 202);

      await createGraphHttpAdapter(getToken).sendMail({
        ...mail,
        attachment: {
          name: 'reported-email.eml',
          contentType: 'message/rfc822',
          content: new Blob(['hi'], { type: 'message/rfc822' }),
        },
      });

      const message = sentBody(fetchMock).message as Record<string, unknown>;

      expect(message.attachments).toEqual([
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: 'reported-email.eml',
          contentType: 'message/rfc822',
          contentBytes: 'aGk=',
        },
      ]);
    });

    it('sends no attachments array entry when the method does not want one', async () => {
      const fetchMock = stubFetch('', 202);

      await createGraphHttpAdapter(getToken).sendMail(mail);

      const message = sentBody(fetchMock).message as Record<string, unknown>;

      expect(message.attachments).toEqual([]);
    });
  });

  describe('moveMessage', () => {
    it('moves by well-known folder name rather than by id', async () => {
      const fetchMock = stubFetch('{}', 201);

      await createGraphHttpAdapter(getToken).moveMessage('AAMkAD==', 'junkemail');

      // Folder ids differ per mailbox; the well-known names are the only form
      // that works for every user without a lookup first.
      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${GRAPH_BASE_URL}/me/messages/AAMkAD%3D%3D/move`);
      expect(sentBody(fetchMock)).toEqual({ destinationId: 'junkemail' });
    });

    it('fails with ERR_012 when the message is already gone', async () => {
      stubFetch('{}', 404);

      await expect(createGraphHttpAdapter(getToken).moveMessage('AAMkAD==', 'deleteditems')).rejects.toMatchObject({
        code: 'ERR_012',
        payload: { status: 404 },
      });
    });
  });

  describe('timeouts', () => {
    /** Stubs a `fetch` that only ever settles when its signal aborts. */
    function stubHangingFetch(): void {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_input: RequestInfo | URL, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
            }),
        ),
      );
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ['getMimeMessage', (adapter: GraphAdapter): Promise<unknown> => adapter.getMimeMessage('AAMkAD==')],
      ['sendMail', (adapter: GraphAdapter): Promise<unknown> => adapter.sendMail(mail)],
    ])('gives %s the message-transfer timeout rather than the default', async (_name, call) => {
      vi.useFakeTimers();
      stubHangingFetch();

      const pending = call(createGraphHttpAdapter(getToken)).catch((thrown) => thrown);

      // Still in flight where a short call would already have been aborted --
      // these two move the whole mail, so the default would cut off exactly the
      // large reports that matter.
      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS);
      expect(vi.getTimerCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(
        MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS - DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS,
      );

      await expect(pending).resolves.toMatchObject({
        code: 'ERR_020',
        payload: { timeoutInMilliseconds: MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS },
      });
    });

    it('leaves moveMessage on the default timeout, since it only sends a folder name', async () => {
      vi.useFakeTimers();
      stubHangingFetch();

      const pending = createGraphHttpAdapter(getToken)
        .moveMessage('AAMkAD==', 'junkemail')
        .catch((thrown) => thrown);

      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS);

      await expect(pending).resolves.toMatchObject({
        code: 'ERR_020',
        payload: { timeoutInMilliseconds: DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS },
      });
    });
  });
});
