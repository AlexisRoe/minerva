/**
 * The task pane's adapter for Minerva's own API.
 *
 * The pane reads from Microsoft and writes here: this is the only folder that
 * knows the API's paths and payload shapes. The payload types themselves live
 * in `@minerva/typescript-lib`, so a contract change breaks both builds rather
 * than production.
 *
 * What leaves is the {@link MinervaAdapter} interface and two implementations of
 * it. Callers are handed one by `createAdapters()` and never construct either,
 * which is what keeps demo mode a single decision.
 *
 * @see {@link ../../../../backend/api} -- the service behind these calls
 */

export { createMinervaDemoAdapter, DEMO_LATENCY_MS } from './minerva.demo';
export { createMinervaHttpAdapter } from './minerva.http';
export type { MinervaAdapter } from './minerva.types';
export { MINERVA_API_PATH, MINERVA_ENDPOINTS } from './minerva.types';
