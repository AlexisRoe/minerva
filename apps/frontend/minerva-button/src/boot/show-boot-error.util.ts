import { MinervaError } from '@minerva/typescript-lib';

import {
  BOOT_ELEMENT_ID,
  BOOT_ERROR_CODE_ELEMENT_ID,
  BOOT_ERROR_ELEMENT_ID,
  BOOT_ERROR_ID_ELEMENT_ID,
  BOOT_ERROR_MESSAGE_ELEMENT_ID,
} from '../constants/bootstrap.constants';

/**
 * Fills one detail line, or leaves it hidden when there is nothing to say.
 *
 * Hidden rather than blank: a label with no value beside it invites someone to
 * read out something that is not there.
 */
function fill(elementId: string, label: string, value: string | undefined): void {
  const element = document.getElementById(elementId);

  if (!element || value === undefined || value === '') {
    return;
  }

  element.textContent = label === '' ? value : `${label} ${value}`;
  element.removeAttribute('hidden');
}

/**
 * Shows the static failure screen `index.html` ships alongside the loader.
 *
 * The counterpart to {@link BootstrapErrorView} for everything that fails
 * *before* React exists -- `loadConfig()` above all, which the whole bootstrap
 * hangs on and which fails for the two most ordinary reasons there are: no
 * network, or a deployment with no `config.json` beside it. Until this, those
 * failures reached the user as a spinner that never stopped.
 *
 * There is no component tree at this point and no translator worth the name, so
 * this manipulates markup the document already carries rather than rendering
 * anything. It is deliberately the same *shape* as the React screen -- title,
 * advice, then the details worth quoting -- so the user meets one Minerva on
 * either side of the line where React starts.
 *
 * A code only exists on a {@link MinervaError}, and the event id only once
 * Sentry has answered; each line stays hidden without one. The spinner is
 * stopped rather than left turning under a message saying the app is not
 * coming.
 *
 * @param error - Whatever the bootstrap rejected with.
 * @param errorId - Sentry's event id for it, if the report produced one.
 *
 * @example
 * ```ts
 * bootstrap().catch((error: unknown) => {
 *   showBootError(error, captureError(error));
 * });
 * ```
 */
export function showBootError(error: unknown, errorId?: string): void {
  document.getElementById(BOOT_ELEMENT_ID)?.setAttribute('data-failed', 'true');
  document.getElementById(BOOT_ERROR_ELEMENT_ID)?.removeAttribute('hidden');

  const isMinerva = MinervaError.is(error);

  // Only ours is shown. Anything else is a message written for whoever wrote the
  // throw -- a stack frame, a bundler path, a `TypeError` about `undefined` --
  // and putting that in front of a user says nothing they can act on.
  fill(BOOT_ERROR_MESSAGE_ELEMENT_ID, '', isMinerva ? error.message : undefined);
  fill(BOOT_ERROR_CODE_ELEMENT_ID, 'Code:', isMinerva ? error.code : undefined);
  fill(BOOT_ERROR_ID_ELEMENT_ID, 'Reference:', errorId);
}
