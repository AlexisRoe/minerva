import { useState } from 'react';
import { DISPOSITION } from '@/constants/email.constants';
import type { ReportVariant } from '@/domain/reporting/reporting.types';
import { useAdapters } from '@/platform/config/hooks/use-adapters.hook';
import type { TranslationKey } from '@/platform/i18n/utils/translate.util';
import { captureError } from '@/platform/sentry/utils/capture-error.util';
import { useOffice } from '@/stores/session/hooks/use-office.hook';

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
 * <Button onClick={dismiss} variant="outline">{t('general.close')}</Button>
 * <Button loading={isMoving} onClick={dispose}>{t(labelKey)}</Button>
 * ```
 */
export function useMessageDisposition(reportedAs: ReportVariant): MessageDisposition {
  const { office, graph } = useAdapters();
  const { environment, message } = useOffice();

  const [isMoving, setIsMoving] = useState(false);
  const [moveFailed, setMoveFailed] = useState(false);

  const { folder, labelKey } = DISPOSITION[reportedAs];

  async function move(): Promise<void> {
    if (environment === null || message === null) {
      return;
    }

    setIsMoving(true);
    setMoveFailed(false);

    try {
      await graph.moveMessage(message.exchangeId, folder);
      office.closePane();
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
    dispose: () => void move(),
    dismiss: () => office.closePane(),
  };
}
