import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DialogMessage } from '../auth.types';
import { AUTH_DIALOG_PATH, acquireTokenViaDialog } from './dialog.util';

type Handler = (event: unknown) => void;

/**
 * Installs an `Office` global whose dialog can be driven from a test.
 *
 * The returned `fire` is what stands in for the user: nothing happens in this
 * flow until either a message or a dialog event arrives.
 */
function stubOffice(options: { opens?: boolean; openError?: { message: string } | null } = {}) {
  // `null` means Office reported a failure but attached no error object, which is
  // distinct from the option simply not being set.
  const { opens = true, openError = { message: 'popups blocked' } } = options;
  const handlers = new Map<string, Handler>();
  const close = vi.fn();
  const displayed: string[] = [];

  vi.stubGlobal('Office', {
    AsyncResultStatus: { Succeeded: 'succeeded', Failed: 'failed' },
    EventType: {
      DialogMessageReceived: 'dialogMessageReceived',
      DialogEventReceived: 'dialogEventReceived',
    },
    context: {
      ui: {
        displayDialogAsync: (url: string, _options: unknown, callback: (result: unknown) => void) => {
          displayed.push(url);

          callback(
            opens
              ? {
                  status: 'succeeded',
                  value: {
                    close,
                    addEventHandler: (event: string, handler: Handler) => {
                      handlers.set(event, handler);
                    },
                  },
                }
              : { status: 'failed', error: openError ?? undefined },
          );
        },
      },
    },
  });

  return {
    close,
    displayed,
    /** Delivers a `messageParent` payload, exactly as Office would. */
    message: (payload: string) => handlers.get('dialogMessageReceived')?.({ message: payload }),
    /** Delivers a dialog lifecycle event, e.g. the user closing the window. */
    event: (error: number) => handlers.get('dialogEventReceived')?.({ error }),
  };
}

/** Serialises a message the way the dialog page does. */
function serialise(message: DialogMessage): string {
  return JSON.stringify(message);
}

describe('acquireTokenViaDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with the token the dialog relays back', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    office.message(serialise({ status: 'success', accessToken: 'dialog-token' }));

    await expect(pending).resolves.toBe('dialog-token');
    expect(office.close).toHaveBeenCalled();
  });

  it('passes the client id on, since the dialog cannot load config.json', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    office.message(serialise({ status: 'success', accessToken: 'dialog-token' }));
    await pending;

    const url = new URL(office.displayed[0] as string);

    expect(url.pathname).toBe(AUTH_DIALOG_PATH);
    expect(url.searchParams.get('clientId')).toBe('client-1');
  });

  it('rejects with ERR_015 when the dialog reports a failure', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    office.message(serialise({ status: 'failure', reason: 'consent_required' }));

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_015',
      payload: { reason: 'consent_required' },
    });
  });

  it('settles when the user closes the window', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    // 12006 is the user closing the dialog. Without this handler the pane would
    // wait for ever on a relay message that is never going to arrive.
    office.event(12006);

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_015',
      payload: { reason: 'dialog-event-12006' },
    });
  });

  it('names a reason even when the dialog event carries no code', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    office.event(undefined as unknown as number);

    // Office does not always populate `error`; a reason of `undefined` would tell
    // whoever reads the Sentry issue nothing at all.
    await expect(pending).rejects.toMatchObject({ payload: { reason: 'dialog-event-0' } });
  });

  it('survives an unreadable payload on the relay', async () => {
    const office = stubOffice();
    const pending = acquireTokenViaDialog('client-1');

    // An error page served in place of the dialog arrives here as HTML, not JSON.
    office.message('<!doctype html><title>502</title>');

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_015',
      payload: { reason: 'unreadable-message' },
    });
    expect(office.close).toHaveBeenCalled();
  });
});

describe('acquireTokenViaDialog when the dialog cannot open', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports the reason Office gave', async () => {
    stubOffice({ opens: false });

    await expect(acquireTokenViaDialog('client-1')).rejects.toMatchObject({
      code: 'ERR_015',
      payload: { reason: 'popups blocked' },
    });
  });

  it('still names a reason when Office gives none', async () => {
    stubOffice({ opens: false, openError: null });

    await expect(acquireTokenViaDialog('client-1')).rejects.toMatchObject({
      payload: { reason: 'could-not-open' },
    });
  });
});
