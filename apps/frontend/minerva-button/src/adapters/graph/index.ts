/**
 * The task pane's Microsoft Graph adapter.
 *
 * Graph covers the one gap Office.js leaves: a read-mode item hands over its
 * metadata cheaply, but not its body. Only that call lives here, and only this
 * folder knows the base URL, the `$select` shapes and the bearer header — so
 * moving the call behind the Minerva API later touches nothing above it.
 *
 * Tokens are passed in, never acquired here; acquiring them is the auth
 * dialog's job.
 *
 * @see {@link https://learn.microsoft.com/graph/api/overview}
 */

export type { MessageBody } from './graph.types';
export { GRAPH_BASE_URL } from './graph.types';
export type { MessageBodyState } from './hooks/use-message-body.hook';
export { useMessageBody } from './hooks/use-message-body.hook';
export { readMessageBody } from './utils/read-message-body.util';
