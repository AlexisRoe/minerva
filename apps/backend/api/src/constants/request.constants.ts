/** Shared request id for interservice communication and tracking */
export const RequestIdHeader = 'X-MINERVA-REQUEST-ID';

/**
 * What `GET /health/status` reports as its request id until there is one to
 * report.
 *
 * Nothing reads {@link RequestIdHeader} off an incoming request yet and nothing
 * mints an id for one that arrives without it, so the field has no true value to
 * carry. A uuid would be worse than this: it would look exactly like a working
 * correlation id while matching no log line anywhere, and the only way to find
 * out would be to go looking for the trace it promised. This does not survive
 * being read.
 *
 * Deleting this constant is the last step of wiring request ids up -- it exists
 * so that step has one place to start from.
 */
export const STUB_REQUEST_ID = 'not-yet-wired';

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
