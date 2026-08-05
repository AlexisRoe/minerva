import { demoAuthorization, demoSettings } from '@/fixtures/demo/minerva.fixture';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';
import { useSessionStore } from '@/stores/session/session.store';
import type { SessionData } from '@/stores/session/session.types';

/**
 * A complete pane session, as the start-up sequence would have produced it.
 *
 * The store takes all three slices in one write, so a test that wants one of
 * them has to supply the other two -- which is the behaviour under test, but
 * makes for a wall of setup in every case that only cares about, say, the
 * settings. This is that wall, written once.
 *
 * The demo fixtures rather than hand-written objects, so a test runs against the
 * same values a demo pane does and cannot drift from them.
 *
 * @param overrides The slices this case is actually about.
 * @returns A session ready to hand to `setSession`.
 *
 * @example
 * ```ts
 * const session = sessionFixture({ settings: { ...demoSettings, enabled: false } });
 * ```
 */
export function sessionFixture(overrides: Partial<SessionData> = {}): SessionData {
  return {
    office: { environment: demoEnvironment, message: demoMessage, user: demoUser },
    auth: { authorization: demoAuthorization, flow: 'naa' },
    settings: demoSettings,
    ...overrides,
  };
}

/**
 * Fills the session store the way the start-up sequence would have.
 *
 * The setup line for anything that renders behind the start-up gate: a view, a
 * hook, the reporting loader. Pair it with `useSessionStore.getState().reset()`
 * in an `afterEach`, since the store outlives a single test.
 *
 * @param overrides The slices this case is actually about.
 * @returns What was written, for asserting against.
 *
 * @example
 * ```ts
 * fillSession({ office: { environment: demoEnvironment, message: null, user: demoUser } });
 * ```
 */
export function fillSession(overrides: Partial<SessionData> = {}): SessionData {
  const session = sessionFixture(overrides);

  useSessionStore.getState().setSession(session);

  return session;
}
