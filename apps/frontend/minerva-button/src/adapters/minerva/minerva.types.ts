import type {
  AuthorizationRequest,
  AuthorizationResult,
  MinervaButtonSettings,
  MinervaSettingsRequest,
  ReportingFormData,
  ReportingResponse,
} from '@minerva/typescript-lib';

/**
 * Where the Minerva API is reached, relative to the deployed pane.
 *
 * A same-origin path rather than an absolute URL: the pane and the API are
 * served from the configured `appDomain`, so the browser sends no preflight and
 * the same artefact works in every environment. It also keeps the httpOnly
 * session cookie first-party, which is what makes it survive the browsers that
 * block third-party cookies outright. If they ever diverge, this becomes an
 * entry in `config.entries.ts` and moves into `AppConfig`.
 */
export const MINERVA_API_PATH = '/api';

/**
 * The three endpoints the task pane calls, in the order it calls them.
 *
 * None of them exists on the API yet -- the backend is a scaffold, and they are
 * planned separately -- which is why each has a demo implementation standing in.
 * Written out here rather than inline at the call sites so the eventual backend
 * work has one list to satisfy.
 */
export const MINERVA_ENDPOINTS = {
  /** Trades a Graph token for the session cookie. */
  authorize: `${MINERVA_API_PATH}/button/authorize`,
  /** The tenant's button configuration, in the user's language. */
  settings: `${MINERVA_API_PATH}/button/settings`,
  /** The multipart report upload. */
  report: `${MINERVA_API_PATH}/button/report`,
} as const;

/**
 * Everything the task pane asks of Minerva's own API.
 *
 * An interface rather than three loose functions because this is the seam demo
 * mode is selected at: `createAdapters()` returns either the HTTP set or the
 * fixture set, and nothing above this line can tell which it received. That is
 * what lets the whole flow -- boot, report, confirm -- be walked in a browser
 * with no backend running, and what lets views be tested without stubbing
 * `fetch`.
 *
 * @see {@link ./minerva.demo.ts} -- the fixture implementation
 *
 * @example
 * ```ts
 * const { minerva } = createAdapters(config, getAccessToken);
 * const settings = await minerva.getSettings({ userLanguage: Languages.English });
 * ```
 */
export interface MinervaAdapter {
  /**
   * Trades a Microsoft Graph token for a Minerva session.
   *
   * The backend validates the token against Microsoft and answers by setting a
   * one-hour httpOnly cookie, so the consequential half of this call is the
   * half that does not appear in the return type.
   *
   * @param request The Graph token to validate.
   * @returns Who was signed in, and the session id to quote in reports.
   *
   * @example
   * ```ts
   * const session = await minerva.authorize({ authToken });
   * ```
   */
  authorize(request: AuthorizationRequest): Promise<AuthorizationResult>;

  /**
   * Reads the tenant's button configuration, translated into the user's language.
   *
   * @param request Which catalogue the reporting reasons should come back in.
   * @returns The settings the report page and confirmation page are built from.
   *
   * @example
   * ```ts
   * const settings = await minerva.getSettings({ userLanguage: Languages.German });
   * ```
   */
  getSettings(request: MinervaSettingsRequest): Promise<MinervaButtonSettings>;

  /**
   * Uploads the raw email and what the user said about it.
   *
   * The response carries the `reportId` the notification emails are stamped
   * with, so this has to complete before any mail is sent.
   *
   * @param form The MIME blob plus the user's reasons and free text.
   * @returns The report id, and what the backend recognised the email as.
   *
   * @example
   * ```ts
   * const { reportId } = await minerva.submitReport(form);
   * ```
   */
  submitReport(form: ReportingFormData): Promise<ReportingResponse>;
}
