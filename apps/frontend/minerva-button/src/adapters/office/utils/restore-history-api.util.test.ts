import { afterEach, describe, expect, it, vi } from 'vitest';

import { restoreHistoryApi } from './restore-history-api.util';

/** Reproduces what Office.js does to the History API outside an Office client. */
function breakHistory(): void {
  Object.assign(window.history, { pushState: undefined, replaceState: undefined });
}

describe('restoreHistoryApi', () => {
  afterEach(() => {
    delete window.__minervaHistoryApi;

    // Before the deletions below: one case stubs `history` away entirely, and
    // there is nothing to delete a property from until it is back.
    vi.unstubAllGlobals();

    // The methods are own properties once anything has assigned them; deleting
    // uncovers jsdom's originals on the prototype again.
    Reflect.deleteProperty(window.history, 'pushState');
    Reflect.deleteProperty(window.history, 'replaceState');
  });

  it('puts both methods back after Office.js removed them', () => {
    breakHistory();

    restoreHistoryApi();

    expect(typeof window.history.pushState).toBe('function');
    expect(typeof window.history.replaceState).toBe('function');
  });

  it('restores a working implementation, not just something callable', () => {
    breakHistory();
    restoreHistoryApi();

    window.history.replaceState({ marker: 'restored' }, '');

    // The whole point is that a router can drive navigation through it; a shim
    // that swallowed the call would leave the pane with no history state.
    expect(window.history.state).toEqual({ marker: 'restored' });
  });

  it('prefers the snapshot the document took before Office.js ran', () => {
    const pushState = vi.fn();
    const replaceState = vi.fn();
    window.__minervaHistoryApi = { pushState, replaceState };
    breakHistory();

    restoreHistoryApi();
    window.history.replaceState(null, '');

    expect(replaceState).toHaveBeenCalled();
  });

  it('leaves an untouched History API alone', () => {
    const { pushState, replaceState } = window.history;

    restoreHistoryApi();

    // Inside Outlook nothing is broken, and reinstalling would mean handing the
    // router a copy of an API the host may have wrapped deliberately.
    expect(window.history.pushState).toBe(pushState);
    expect(window.history.replaceState).toBe(replaceState);
  });

  it('does nothing when there is no history to repair', () => {
    vi.stubGlobal('history', undefined);

    expect(() => {
      restoreHistoryApi();
    }).not.toThrow();
  });
});
