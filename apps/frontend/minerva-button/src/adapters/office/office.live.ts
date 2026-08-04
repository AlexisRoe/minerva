import type { OfficeAdapter, OfficeEnvironment, OfficeHost } from '@/adapters/office/office.types';
import { closePane } from '@/adapters/office/utils/close-pane.util';
import { readCurrentMessage } from '@/adapters/office/utils/read-current-message.util';
import { readCurrentUser } from '@/adapters/office/utils/read-current-user.util';
import { readEnvironment } from '@/adapters/office/utils/read-environment.util';
import { waitForOffice } from '@/adapters/office/utils/wait-for-office.util';
import { acquireToken } from '@/auth-dialog/utils/acquire-token.util';
import { OfficeNotReadyError } from '@/domain/errors/office.errors';
import type { AppConfig } from '@/platform/config/config.types';

/**
 * The Office adapter that talks to a real Outlook.
 *
 * A closure rather than a class, and the state it closes over is the point: the
 * environment learned by {@link OfficeAdapter.readHost} is what decides whether
 * a token is brokered through NAA or through a dialog, and it is read long
 * before anyone asks for a token. Keeping it here means the Graph adapter can be
 * built at start-up with `() => office.acquireToken()` and still get the right
 * flow, without the boot sequence threading an `OfficeEnvironment` through
 * every layer that does not care about one.
 *
 * The client id comes from the configuration because the same artefact is
 * deployed against different tenants; it is read once here so nothing
 * downstream has to hold the configuration just to sign in.
 *
 * @param config The configuration the app booted with.
 * @returns An adapter bound to the host this page is running in.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in}
 *
 * @example
 * ```ts
 * const office = createOfficeLiveAdapter(config);
 * const { message } = await office.readHost();
 * ```
 */
export function createOfficeLiveAdapter(config: AppConfig): OfficeAdapter {
  let environment: OfficeEnvironment | null = null;

  return {
    async readHost(): Promise<OfficeHost> {
      const info = await waitForOffice();

      environment = readEnvironment(info);

      // Both readers are synchronous and both throw if the gate has not run,
      // which is why they come after `readEnvironment` rather than beside it.
      return { environment, message: readCurrentMessage(), user: readCurrentUser() };
    },

    async acquireToken(): Promise<string> {
      if (environment === null) {
        // A wiring fault rather than a state a user can reach: the boot sequence
        // reads the host before anything asks for a token.
        throw new OfficeNotReadyError('acquireToken');
      }

      const { accessToken } = await acquireToken(config.entraClientId, environment);

      return accessToken;
    },

    closePane,
  };
}
