import type { Adapters } from '@/adapters/create-adapters.util';
import { createGraphDemoAdapter } from '@/adapters/graph/graph.demo';
import { createMinervaDemoAdapter } from '@/adapters/minerva/minerva.demo';
import { createOfficeDemoAdapter } from '@/adapters/office/office.demo';

/**
 * An adapter set for tests and stories, answering entirely from fixtures.
 *
 * The demo adapters rather than hand-written fakes, so a test renders against
 * the same objects a demo pane runs on and cannot drift from them. A fresh set
 * per call because the Graph demo adapter records what it was asked to send.
 *
 * @param overrides What this case is actually about.
 * @returns A complete {@link Adapters}.
 *
 * @example
 * ```tsx
 * const adapters = adaptersFixture({ minerva: { ...createMinervaDemoAdapter(), submitReport: vi.fn() } });
 * render(<ConfigProvider adapters={adapters} config={configFixture}>…</ConfigProvider>);
 * ```
 */
export function adaptersFixture(overrides: Partial<Adapters> = {}): Adapters {
  return {
    office: createOfficeDemoAdapter(),
    minerva: createMinervaDemoAdapter(),
    graph: createGraphDemoAdapter().adapter,
    ...overrides,
  };
}
