/**
 * The task pane's Microsoft Graph adapter.
 *
 * Graph covers the three gaps Office.js leaves in read mode: it will not hand
 * over the raw MIME, it will not send mail as the user, and it will not move an
 * item. Only those calls live here, and only this folder knows the base URL, the
 * resource shapes and the bearer header.
 *
 * Tokens are passed in, never acquired here; acquiring them is `src/auth/`'s
 * job, and which flow it used is not this folder's business.
 *
 * @see {@link https://learn.microsoft.com/graph/api/overview}
 */

export { createGraphDemoAdapter } from './graph.demo';
export { createGraphHttpAdapter, MAX_CUSTOM_HEADERS } from './graph.http';
export type {
  AccessTokenProvider,
  GraphAdapter,
  MailAttachment,
  NotificationMail,
  WellKnownFolder,
} from './graph.types';
export { GRAPH_BASE_URL } from './graph.types';
export { encodeAttachment } from './utils/encode-attachment.util';
