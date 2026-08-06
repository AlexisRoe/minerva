/** Shared request id for interservice communication and tracking */
export const RequestIdHeader = 'X-MINERVA-REQUEST-ID';

/**
 * The largest request body the api parses, in the string form the body parsers
 * take.
 *
 * Sized for the work items this api ingests: an email with its headers and a
 * few inline attachments, serialised as JSON, and JSON of a base64 payload is a
 * third larger than the bytes it carries. Express defaults to `100kb`, which a
 * single screenshot pasted into a mail already exceeds.
 *
 * It is still a ceiling, not a target -- the parser buffers the whole body in
 * memory before a controller sees any of it, so raising this raises what a
 * single unauthenticated request can make the process allocate.
 */
export const BODY_SIZE_LIMIT = '5mb';
