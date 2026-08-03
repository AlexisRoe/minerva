import { useEffect, useState } from 'react';

import type { MessageBody } from '../graph.types';
import { readMessageBody } from '../utils/read-message-body.util';

/** What {@link useMessageBody} hands a view. */
export interface MessageBodyState {
  /** The body, `null` while it is being fetched or when there is no message. */
  readonly body: MessageBody | null;
  /** Whether a fetch is in flight. */
  readonly isLoading: boolean;
}

/**
 * Fetches the body of a message once its id and an access token are known.
 *
 * Both arguments are nullable on purpose: the id arrives from the Office
 * adapter one render later, and the token from the auth dialog later still, so
 * the hook has to sit idle until it has them. A stale response is dropped, so
 * switching messages cannot leave the previous body on screen.
 *
 * @param messageId The message to read, or `null` while it is unknown.
 * @param accessToken A bearer token with `Mail.Read`, or `null` while unknown.
 * @returns The body and whether it is still loading.
 *
 * @example
 * ```tsx
 * const { body, isLoading } = useMessageBody(message?.id ?? null, token);
 * ```
 */
export function useMessageBody(messageId: string | null, accessToken: string | null): MessageBodyState {
  const [body, setBody] = useState<MessageBody | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!messageId || !accessToken) {
      return;
    }

    let active = true;
    setIsLoading(true);

    readMessageBody(messageId, accessToken).then((result) => {
      if (!active) {
        return;
      }

      setBody(result);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [messageId, accessToken]);

  return { body, isLoading };
}
