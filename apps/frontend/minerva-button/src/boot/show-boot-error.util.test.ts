import { MinervaError } from '@minerva/typescript-lib';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BOOT_ELEMENT_ID,
  BOOT_ERROR_CODE_ELEMENT_ID,
  BOOT_ERROR_ELEMENT_ID,
  BOOT_ERROR_ID_ELEMENT_ID,
  BOOT_ERROR_MESSAGE_ELEMENT_ID,
} from '../constants/bootstrap.constants';
import { showBootError } from './show-boot-error.util';

/** A failure of the kind `loadConfig` throws. */
class ConfigUnreachableError extends MinervaError {
  constructor() {
    super({
      reference: 'c3d4e5f6-a7b8-4901-9234-5c6d7e8f9a0b',
      code: 'ERR_002',
      message: 'Minerva could not read its configuration.',
      logLevel: 'error',
      payload: {},
    });
  }
}

/**
 * Rebuilds the block `index.html` ships.
 *
 * Written out rather than imported, because the point of these tests is that the
 * ids this util reaches for are the ids the document actually carries -- so a
 * rename in the markup has to fail here.
 */
function renderBootMarkup(): void {
  document.body.innerHTML = `
    <div id="${BOOT_ELEMENT_ID}" class="minerva-boot">
      <span class="minerva-boot__spinner"></span>
      <div id="${BOOT_ERROR_ELEMENT_ID}" class="minerva-boot__error" hidden>
        <h1 class="minerva-boot__title">Minerva could not start.</h1>
        <p class="minerva-boot__message">The add-in stopped before it could open.</p>
        <p id="${BOOT_ERROR_MESSAGE_ELEMENT_ID}" class="minerva-boot__message" hidden></p>
        <p id="${BOOT_ERROR_CODE_ELEMENT_ID}" class="minerva-boot__detail" hidden></p>
        <p id="${BOOT_ERROR_ID_ELEMENT_ID}" class="minerva-boot__detail" hidden></p>
      </div>
    </div>`;
}

/** Whether the element with this id is currently shown. */
function isShown(elementId: string): boolean {
  return document.getElementById(elementId)?.hasAttribute('hidden') === false;
}

describe('showBootError', () => {
  beforeEach(() => {
    renderBootMarkup();
  });

  it('reveals the failure block, which the document ships hidden', () => {
    showBootError(new ConfigUnreachableError());

    expect(isShown(BOOT_ERROR_ELEMENT_ID)).toBe(true);
  });

  it('stops the spinner, rather than leaving it turning under the message', () => {
    showBootError(new ConfigUnreachableError());

    expect(document.getElementById(BOOT_ELEMENT_ID)?.dataset.failed).toBe('true');
  });

  it('quotes the code and the message of one of ours', () => {
    const error = new ConfigUnreachableError();
    showBootError(error);

    expect(document.getElementById(BOOT_ERROR_MESSAGE_ELEMENT_ID)?.textContent).toBe(error.message);
    expect(document.getElementById(BOOT_ERROR_CODE_ELEMENT_ID)?.textContent).toContain('ERR_002');
  });

  it('shows the Sentry event id it was given', () => {
    showBootError(new ConfigUnreachableError(), 'a1b2c3d4e5f60718293a4b5c6d7e8f90');

    expect(document.getElementById(BOOT_ERROR_ID_ELEMENT_ID)?.textContent).toContain(
      'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    );
  });

  it('leaves the id line hidden while there is no id to quote', () => {
    showBootError(new ConfigUnreachableError());

    // An empty label invites someone to read out something that is not there.
    expect(isShown(BOOT_ERROR_ID_ELEMENT_ID)).toBe(false);
  });

  it('shows neither a code nor a message for a failure that is not ours', () => {
    showBootError(new TypeError('undefined is not a function'), 'a1b2c3d4e5f60718293a4b5c6d7e8f90');

    // A bundler path or a TypeError is written for whoever wrote the throw; the
    // static advice above it is the part a user can act on.
    expect(isShown(BOOT_ERROR_CODE_ELEMENT_ID)).toBe(false);
    expect(isShown(BOOT_ERROR_MESSAGE_ELEMENT_ID)).toBe(false);
    expect(isShown(BOOT_ERROR_ID_ELEMENT_ID)).toBe(true);
  });

  it('does nothing rash when the markup is not there at all', () => {
    document.body.innerHTML = '';

    // The boot splash is only in `index.html`; a host that mounts this bundle
    // some other way must not take a crash on the failure path of a crash.
    expect(() => showBootError(new ConfigUnreachableError(), 'abc')).not.toThrow();
  });
});
