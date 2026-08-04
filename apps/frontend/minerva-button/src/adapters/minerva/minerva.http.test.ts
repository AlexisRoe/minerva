import { Languages } from '@minerva/typescript-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { demoAuthorization, demoReportingResponse, demoSettings } from '../../demo';
import { createMinervaHttpAdapter } from './minerva.http';
import { MINERVA_ENDPOINTS } from './minerva.types';

/** Stubs `fetch` with one JSON answer and hands back the spy. */
function stubJson(payload: unknown, status = 200) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(payload), { status })),
  );
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** The form the report tests submit; only the fields under test vary. */
const form = {
  file: new Blob(['raw mime'], { type: 'message/rfc822' }),
  reportingReasons: ['reason-a', 'reason-b'],
  feedbackMessage: 'Looks like a fake login page.',
  timeZone: 'Europe/Berlin',
  userLanguage: 'en-GB',
  reportedAs: 'suspicious' as const,
  deliveredAt: '2026-08-03T07:42:00.000Z',
  exchangeId: 'AAMkAD==',
};

describe('createMinervaHttpAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('authorize', () => {
    it('posts the token and returns the session', async () => {
      const fetchMock = stubJson(demoAuthorization);

      await expect(createMinervaHttpAdapter().authorize({ authToken: 'graph-token' })).resolves.toEqual(
        demoAuthorization,
      );

      expect(fetchMock).toHaveBeenCalledWith(
        MINERVA_ENDPOINTS.authorize,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ authToken: 'graph-token' }),
        }),
      );
    });

    it('fails with ERR_011 when the backend rejects the token', async () => {
      stubJson({}, 401);

      await expect(createMinervaHttpAdapter().authorize({ authToken: 'stale' })).rejects.toMatchObject({
        code: 'ERR_011',
        payload: { status: 401 },
      });
    });
  });

  describe('getSettings', () => {
    it('asks for the catalogue by query parameter, not by body', async () => {
      const fetchMock = stubJson(demoSettings);

      await expect(createMinervaHttpAdapter().getSettings({ userLanguage: Languages.German })).resolves.toEqual(
        demoSettings,
      );

      const [url, init] = fetchMock.mock.calls[0] ?? [];

      // A body on a GET is not reliably forwarded by proxies, so the language has
      // to survive in the URL for the response to be cacheable per language.
      expect(url).toBe(`${MINERVA_ENDPOINTS.settings}?userLanguage=${Languages.German}`);
      expect(init?.method).toBe('GET');
      expect(init?.body).toBeUndefined();
    });

    it('fails with ERR_011 when the tenant has no configuration', async () => {
      stubJson({}, 404);

      await expect(createMinervaHttpAdapter().getSettings({ userLanguage: Languages.English })).rejects.toMatchObject({
        code: 'ERR_011',
        payload: { status: 404 },
      });
    });
  });

  describe('submitReport', () => {
    it('uploads the email as multipart with a named .eml part', async () => {
      const fetchMock = stubJson(demoReportingResponse);

      await expect(createMinervaHttpAdapter().submitReport(form)).resolves.toEqual(demoReportingResponse);

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      const body = init.body as FormData;
      const file = body.get('file') as File;

      // Appended without a filename the browser sends it as `blob`, and the
      // backend has nothing to key the .eml on.
      expect(file.name).toBe('reported-email.eml');
      expect(body.get('reportedAs')).toBe('suspicious');
      expect(body.get('exchangeId')).toBe('AAMkAD==');
    });

    it('repeats the reasons rather than JSON-encoding them', async () => {
      const fetchMock = stubJson(demoReportingResponse);

      await createMinervaHttpAdapter().submitReport(form);

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      const body = init.body as FormData;

      expect(body.getAll('reportingReasons')).toEqual(['reason-a', 'reason-b']);
    });

    it('leaves the content type to the browser, so the boundary is set', async () => {
      const fetchMock = stubJson(demoReportingResponse);

      await createMinervaHttpAdapter().submitReport(form);

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;

      // Setting it by hand omits the multipart boundary and produces a body the
      // server cannot parse -- a failure that only shows up against a real backend.
      expect(init.headers).toBeUndefined();
    });

    it('fails with ERR_011 when the upload is rejected', async () => {
      // The reporting action depends on this rejecting rather than resolving with
      // a bad body: it is what stops notification mails going out for a report
      // that was never filed.
      stubJson({}, 413);

      await expect(createMinervaHttpAdapter().submitReport(form)).rejects.toMatchObject({
        code: 'ERR_011',
        payload: { status: 413 },
      });
    });
  });
});
