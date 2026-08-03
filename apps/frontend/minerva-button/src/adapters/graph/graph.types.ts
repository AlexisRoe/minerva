/** The base URL every Graph call in this adapter is built from. */
export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

/**
 * A message body as Graph returns it.
 *
 * Mirrors the `body` property of the `message` resource, which is the one thing
 * Office.js cannot hand over cheaply in read mode.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/itembody}
 */
export interface MessageBody {
  /** How `content` is encoded. */
  readonly contentType: 'text' | 'html';
  /** The body itself, in the encoding `contentType` names. */
  readonly content: string;
}
