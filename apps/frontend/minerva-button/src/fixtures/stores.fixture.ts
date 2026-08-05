import { act } from '@testing-library/react';

import { useReportStore } from '@/stores/report/report.store';
import { useSessionStore } from '@/stores/session/session.store';

/**
 * Empties both Zustand stores between tests, inside `act`.
 *
 * The `act` is the whole point. Vitest runs `afterEach` hooks in reverse
 * registration order, so a hook written in a `describe` can run *before*
 * Testing Library's auto-cleanup -- resetting a store while the tree is still
 * mounted. Components subscribe through `useSyncExternalStore`, so that write
 * re-renders them outside any act scope, and React prints one "not wrapped in
 * act(...)" per subscription: three for `ReportView`, which reads the office,
 * the settings and the draft.
 *
 * The stores outlive a single test, so something has to clear them; doing it
 * here means no test file has to remember why the wrapping matters.
 *
 * @example
 * ```ts
 * afterEach(resetStores);
 * ```
 */
export function resetStores(): void {
  act(() => {
    useSessionStore.getState().reset();
    useReportStore.getState().reset();
  });
}
