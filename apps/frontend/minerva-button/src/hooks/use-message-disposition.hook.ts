import { useState } from 'react';

import type { WellKnownFolder } from '../adapters/graph';
import { closePane } from '../adapters/office';
import { useConfig } from '../config';
import type { TranslationKey } from '../i18n';
import { createPaneAdapters } from '../routing';
import { captureError } from '../sentry';
import { type ReportVariant, useOffice } from '../store';

/**
 * Where each report sends the mail, and what the button offering it says.
 *
 * Suspicious mail is deleted and spam is filed under junk, which is what the two
 * reports mean to a mailbox: one is a threat to be rid of, the other is noise to
 * be trained on. Both names are Graph's well-known folders, which is the only
 * form that works for every user without a lookup.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/mailfolder}
 */
export const DISPOSITION = Object.freeze({
  suspicious: { folder: 'deleteditems', labelKey: 'footer-delete' },
  spam: { folder: 'junkemail', labelKey: 'footer-spam' },
} as const satisfies Record<ReportVariant, { folder: WellKnownFolder; labelKey: TranslationKey }>);

/** The last thing the pane can do, and what it is doing about it right now. */
export interface MessageDisposition {
  /** The i18n key for the action button, named for where the mail is going. */
  readonly labelKey: TranslationKey;
  /** Whether the move is in flight, for the button's loading state. */
  readonly isMoving: boolean;
  /** Whether the last move failed, so the screen can say so. */
  readonly moveFailed: boolean;
  /** Moves the mail to this variant's folder, then closes the pane. */
  readonly dispose: () => void;
  /** Closes the pane, leaving the mail where it is. */
  readonly dismiss: () => void;
}

/**
 * Owns the confirmation screen's two exits: file the mail away, or just leave.
 *
 * A hook rather than view code because none of this is presentation. Which
 * folder a report implies, that the move happens through Graph and not Office,
 * that a failure must be captured and shown rather than swallowed, and that the
 * pane closes only once the move has actually succeeded -- all of it survives
 * any change to how the screen looks.
 *
 * The order matters and is the reason moving is not part of the reporting
 * action: moving first would leave a user who hit a Graph failure with a mail
 * that had vanished and no report filed. So the mail is only touched after the
 * report is safely in, and only on the user's say-so.
 *
 * A failed move deliberately leaves the pane open. Closing it would let the user
 * believe the mail had gone.
 *
 * @param reportedAs Which report was filed, which decides where the mail goes.
 * @returns The button's label and loading state, and the two things it can do.
 *
 * @see {@link https://learn.microsoft.com/graph/api/message-move}
 *
 * @example
 * ```tsx
 * const { labelKey, isMoving, dispose, dismiss } = useMessageDisposition('spam');
 *
 * <Button onClick={dismiss} variant="outline">{t('close')}</Button>
 * <Button loading={isMoving} onClick={dispose}>{t(labelKey)}</Button>
 * ```
 */
export function useMessageDisposition(reportedAs: ReportVariant): MessageDisposition {
  const config = useConfig();
  const { environment, message } = useOffice();

  const [isMoving, setIsMoving] = useState(false);
  const [moveFailed, setMoveFailed] = useState(false);

  const { folder, labelKey } = DISPOSITION[reportedAs];

  async function move(): Promise<void> {
    // Neither exists outside a real host, and there is nothing to move without
    // them -- the button is a no-op rather than an error the user cannot act on.
    if (environment === null || message === null) {
      return;
    }

    setIsMoving(true);
    setMoveFailed(false);

    try {
      const { graph } = createPaneAdapters(config, environment);

      await graph.moveMessage(message.exchangeId, folder);
      closePane();
    } catch (error) {
      captureError(error);
      setMoveFailed(true);
      setIsMoving(false);
    }
  }

  return {
    labelKey,
    isMoving,
    moveFailed,
    // Wrapped rather than handed over directly, so the caller can pass this to
    // `onClick` without a floating promise.
    dispose: () => void move(),
    dismiss: closePane,
  };
}
