import type {
  AuthorizationRequest,
  AuthorizationResult,
  MinervaButtonSettings,
  MinervaSettingsRequest,
  ReportingFormData,
  ReportingResponse,
} from '@minerva/typescript-lib';
import { request } from '@/adapters/utils/request.util';
import { MinervaRequestFailedError } from '@/domain/errors/request.errors';
import { MINERVA_ENDPOINTS, type MinervaAdapter } from './minerva.types';

/** Builds the multipart body for {@link MinervaAdapter.submitReport}. */
function toFormData(form: ReportingFormData): FormData {
  const body = new FormData();

  // The blob is named rather than appended bare: without a filename the browser
  // sends it as `blob`, and the backend has nothing to key the .eml on.
  body.append('file', form.file, 'reported-email.eml');
  body.append('feedbackMessage', form.feedbackMessage);
  body.append('timeZone', form.timeZone);
  body.append('userLanguage', form.userLanguage);
  body.append('reportedAs', form.reportedAs);
  body.append('deliveredAt', form.deliveredAt);
  body.append('exchangeId', form.exchangeId);

  // Repeated rather than JSON-encoded, which is how multipart carries a list.
  for (const reason of form.reportingReasons) {
    body.append('reportingReasons', reason);
  }

  return body;
}

/**
 * The real {@link MinervaAdapter}, talking to Minerva's API over HTTP.
 *
 * Every call goes through `request()`, so the session cookie travels and a
 * non-2xx becomes an `ERR_011` rather than an unchecked `Response`. Nothing
 * here reads configuration: the API is same-origin by construction, and the
 * cookie is set by the server, so there is no base URL and no token to thread
 * through.
 *
 * @returns The HTTP implementation of the Minerva adapter.
 *
 * @see {@link ./minerva.demo.ts} -- what stands in when `config.demo` is on
 *
 * @example
 * ```ts
 * const minerva = createMinervaHttpAdapter();
 * ```
 */
export function createMinervaHttpAdapter(): MinervaAdapter {
  return {
    async authorize(payload: AuthorizationRequest): Promise<AuthorizationResult> {
      const response = await request(
        MINERVA_ENDPOINTS.authorize,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        (path, status, cause) => new MinervaRequestFailedError(path, status, cause),
      );

      return (await response.json()) as AuthorizationResult;
    },

    async getSettings(payload: MinervaSettingsRequest): Promise<MinervaButtonSettings> {
      // A GET with the language as a query parameter: the settings are cacheable
      // per language, and a body on a GET is not reliably forwarded by proxies.
      const query = new URLSearchParams({ userLanguage: payload.userLanguage });

      const response = await request(
        `${MINERVA_ENDPOINTS.settings}?${query.toString()}`,
        { method: 'GET' },
        (path, status, cause) => new MinervaRequestFailedError(path, status, cause),
      );

      return (await response.json()) as MinervaButtonSettings;
    },

    async submitReport(form: ReportingFormData): Promise<ReportingResponse> {
      const response = await request(
        MINERVA_ENDPOINTS.report,
        // No Content-Type header on purpose: the browser has to set it itself so
        // that it can append the multipart boundary. Setting it by hand produces
        // a body the server cannot parse.
        { method: 'POST', body: toFormData(form) },
        (path, status, cause) => new MinervaRequestFailedError(path, status, cause),
      );

      return (await response.json()) as ReportingResponse;
    },
  };
}
