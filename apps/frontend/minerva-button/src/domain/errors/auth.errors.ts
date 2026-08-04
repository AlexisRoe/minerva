import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors around signing the user in.
 *
 * Sign-in is the one step of start-up that cannot be retried into working: by
 * the time these are thrown the user has usually already been shown a prompt and
 * has either dismissed it or been refused. So none of them is a warning -- each
 * one ends the boot sequence on the error screen.
 *
 * The three are kept apart because they are fixed by different people. A missing
 * client id is a deployment that was rolled out incomplete; a refused token is a
 * tenant's consent or conditional-access policy; a failed dialog is usually the
 * user closing it. Merging them would make a Sentry issue unactionable.
 *
 * @see {@link ./office.errors.ts} -- the same pattern, for the start-up gate
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in}
 */

/**
 * The pane was asked to sign in but has no Entra application to sign in to.
 *
 * `entraClientId` is `null`, which means `APP_FE_RB_ENTRA_CLIENT_ID` was unset
 * when this bundle's `config.json` was written. Nothing a user or a tenant can
 * do about it -- the deployment is incomplete -- hence `fatal`.
 */
export class AuthClientIdMissingError extends MinervaError {
  constructor(cause?: Error) {
    super({
      reference: 'c835513f-9b6d-4cf0-9a3c-fb840b4c81dd',
      code: 'ERR_013',
      message: 'Minerva is not configured to sign you in.',
      logLevel: 'fatal',
      payload: {},
      cause,
    });
  }
}

/**
 * No access token could be acquired, silently or interactively.
 *
 * Both halves of the NAA flow have been tried by the time this is thrown: the
 * silent call failed, and the popup that was raised to fix it failed too. In
 * practice that is a consent that was never granted, a conditional-access policy
 * refusing the device, or a user who dismissed the prompt.
 *
 * @see {@link https://learn.microsoft.com/entra/identity-platform/msal-js-prompt-behavior}
 */
export class TokenAcquisitionFailedError extends MinervaError {
  constructor(flow: string, cause?: Error) {
    super({
      reference: 'f8512657-968b-414b-8fac-142a8c175676',
      code: 'ERR_014',
      message: 'Minerva could not sign you in.',
      logLevel: 'error',
      payload: { flow },
      cause,
    });
  }
}

/**
 * The Office sign-in dialog closed without handing a token back.
 *
 * Only reachable on clients too old for Nested App Authentication, where the
 * dialog is the fallback. The usual cause is the user closing the window, which
 * Office reports as error `12006` -- ordinary behaviour, but still a dead end
 * for this boot, so the pane says so rather than hanging on a promise that will
 * never settle.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/dialog-handle-errors-events}
 */
export class AuthDialogFailedError extends MinervaError {
  constructor(reason: string, cause?: Error) {
    super({
      reference: 'c8dc444c-ee53-4bda-87e6-28dd03f0f22b',
      code: 'ERR_015',
      message: 'The sign-in window closed before Minerva could sign you in.',
      logLevel: 'error',
      payload: { reason },
      cause,
    });
  }
}
