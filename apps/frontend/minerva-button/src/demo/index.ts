/**
 * The fixtures demo mode answers from.
 *
 * One folder rather than fixtures scattered beside the adapters, because they
 * have to agree with one another: the MIME blob's headers are the demo message's
 * headers, the session's profile is the demo user's. A walkthrough where the
 * subject on screen did not match the subject in the attachment would undermine
 * exactly the thing being demonstrated.
 *
 * These are also the fixtures the view tests build on, so they are written to be
 * plausible rather than minimal.
 *
 * @see {@link ../adapters/create-adapters.util.ts} -- where they are selected
 */

export { createDemoMime, DEMO_MIME_CONTENT } from './mime.fixture';
export {
  demoAuthorization,
  demoReportingResponse,
  demoReportingResponses,
  demoSettings,
} from './minerva.fixture';
export { demoEnvironment, demoMessage, demoUser } from './office.fixture';
