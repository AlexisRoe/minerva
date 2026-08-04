import { useEffect, useState } from 'react';

import type { OutlookMessage } from '../office.types';
import { readCurrentMessage } from '../utils/read-current-message.util';
import { waitForOffice } from '../utils/wait-for-office.util';

/** What {@link useCurrentMessage} hands a view. */
export interface CurrentMessageState {
  /** The open message, `null` once loading finished without one. */
  readonly message: OutlookMessage | null;
  /** Whether the first read is still in flight. */
  readonly isLoading: boolean;
}

/**
 * Subscribes a view to the message the task pane is open on.
 *
 * The read itself is synchronous; the wait is not. This hook is what makes a
 * component usable outside the start-up gate -- it awaits `waitForOffice()`
 * itself before reading, so the first render always lands with
 * `isLoading: true`. A stale response is dropped rather than written to state:
 * the pane survives the user selecting another mail, and two reads can otherwise
 * resolve out of order.
 *
 * Where the route loader has already run, prefer `useOffice()`: the message is
 * in the store by then, and reading it again is a second round trip to the host
 * for something that cannot have changed.
 *
 * @returns The message and whether it is still being read.
 *
 * @see {@link https://react.dev/reference/react/useEffect#fetching-data-with-effects} -- the cleanup pattern used here
 *
 * @example
 * ```tsx
 * const { message, isLoading } = useCurrentMessage();
 * ```
 */
export function useCurrentMessage(): CurrentMessageState {
  const [message, setMessage] = useState<OutlookMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    waitForOffice()
      .then(() => readCurrentMessage())
      .then((result) => {
        if (!active) {
          return;
        }

        setMessage(result);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { message, isLoading };
}
