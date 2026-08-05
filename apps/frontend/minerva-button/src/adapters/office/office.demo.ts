import type { OfficeAdapter, OfficeHost } from '@/adapters/office/office.types';
import { demoEnvironment, demoMessage, demoUser } from '@/fixtures/demo/office.fixture';

/**
 * The Office adapter for a pane running outside Outlook.
 *
 * Answers from fixtures and never touches the `Office` global, which is what
 * lets the whole flow be walked in a plain browser -- and what the manager
 * relies on when it embeds the pane in an iframe for a walkthrough.
 *
 * `acquireToken` resolves an empty string rather than throwing: nothing in demo
 * mode reaches the network, so the token is never spent, and refusing to
 * produce one would only force a demo branch back into the boot sequence.
 * `closePane` does nothing, because there is no container to close.
 *
 * @returns An adapter backed by `src/fixtures/demo/office.fixture.ts`.
 *
 * @example
 * ```ts
 * const office = createOfficeDemoAdapter();
 * const { user } = await office.readHost(); // Ada Lovelace
 * ```
 */
export function createOfficeDemoAdapter(): OfficeAdapter {
  return {
    readHost(): Promise<OfficeHost> {
      return Promise.resolve({ environment: demoEnvironment, message: demoMessage, user: demoUser });
    },

    acquireToken(): Promise<string> {
      return Promise.resolve('');
    },

    closePane(): void {
      // Nothing to close: the pane is a page in a browser tab.
    },
  };
}
