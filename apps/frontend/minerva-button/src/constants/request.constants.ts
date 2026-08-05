import { ONE_SECOND } from '@minerva/typescript-lib';

/** Default value after which a request is terminated */
export const DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS = 2.5 * ONE_SECOND;

/**
 * The timeout for the two calls that carry a whole message.
 *
 * `getMimeMessage` downloads the raw `.eml` and `sendMail` uploads it again as a
 * base64 attachment, so both move as much data as the reported mail weighs --
 * megabytes, on the kind of message users report. The default is sized for calls
 * that only exchange a few fields, and applying it here would abort exactly the
 * large reports that matter most.
 */
export const MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS = 30 * ONE_SECOND;

/**
 * The status recorded when a request never got a response at all.
 *
 * `fetch` rejects rather than resolving for DNS failures, refused connections,
 * CORS rejections and offline devices, so there is no real status to record.
 * `0` is the same sentinel `XMLHttpRequest` uses for this, and it cannot
 * collide with an HTTP status.
 */
export const NO_RESPONSE_STATUS = 0;

/**
 * How long a demo call pretends to take, in milliseconds.
 *
 * Not zero on purpose. The loading screens are a real part of this product --
 * the boot sequence and the reporting flow each have a six-step reel -- and an
 * adapter that answered instantly would make them flash past unread, which is
 * the opposite of what a demo is for.
 */
export const DEMO_LATENCY_MS = 600;

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
