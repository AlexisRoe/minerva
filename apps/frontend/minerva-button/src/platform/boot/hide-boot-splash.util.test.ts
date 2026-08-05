import { beforeEach, describe, expect, it } from 'vitest';

import { BOOT_ELEMENT_ID } from '@/constants/bootstrap.constants';
import { hideBootSplash } from './hide-boot-splash.util';
import { showBootError } from './show-boot-error.util';

describe('hideBootSplash', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="${BOOT_ELEMENT_ID}"></div>`;
  });

  it('hides the splash once there is an app behind it', () => {
    hideBootSplash();

    expect(document.getElementById(BOOT_ELEMENT_ID)).toHaveAttribute('hidden');
  });

  it('leaves the markup in the document', () => {
    hideBootSplash();

    // Removing it -- which is what this replaced -- would leave RootErrorBoundary
    // with no screen to reveal, and a provider crash with a blank pane.
    expect(document.getElementById(BOOT_ELEMENT_ID)).not.toBeNull();
  });

  it('can be undone by showBootError, so a late failure still has a screen', () => {
    hideBootSplash();
    showBootError(new Error('the theme provider threw'));

    expect(document.getElementById(BOOT_ELEMENT_ID)).not.toHaveAttribute('hidden');
  });

  it('does nothing when the splash is already gone', () => {
    document.body.innerHTML = '';

    expect(() => hideBootSplash()).not.toThrow();
  });
});
