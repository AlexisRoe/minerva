/**
 * What `GET /health` answers with: the liveness verdict and who gave it.
 *
 * An interface rather than a class — nothing constructs one, it is only ever an
 * object literal on its way to JSON, and a class would need every field
 * initialised to satisfy `strictPropertyInitialization`.
 */
export interface RootResponse {
  /** `ok` while the process can serve traffic; `error` when it knows it cannot. */
  status: 'ok' | 'error';

  /** The service that answered, so a response read out of context is still attributable. */
  name: string;
}
