/**
 * Everything the task pane talks to that is not itself.
 *
 * Three adapters, and one rule they share: nothing above this folder knows how
 * any of them is implemented. `office` hides a global the host injects, `graph`
 * and `minerva` hide the network -- and because the latter two are chosen
 * together by {@link createAdapters}, the whole app runs on fixtures or on the
 * real thing without a single caller branching on it.
 *
 * @see {@link ./create-adapters.util.ts} -- where demo mode is decided
 */

export type { Adapters } from './create-adapters.util';
export { createAdapters } from './create-adapters.util';
export type { RequestFailure } from './utils/request.util';
export { NO_RESPONSE_STATUS, request } from './utils/request.util';
