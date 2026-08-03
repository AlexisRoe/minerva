import { Card, Group, Text } from '@minerva/ui-lib/primitives';

import type { OutlookMessage } from '../../adapters/office';
import { useTranslations } from '../../i18n';

/** What {@link MessageSummary} needs to render. */
export interface MessageSummaryProps {
  /** The message to describe. */
  readonly message: OutlookMessage;
}

/**
 * Shows which message is about to be sent, so the user can check before acting.
 *
 * Presentational on purpose: it takes an {@link OutlookMessage} and calls no
 * adapter, which is what lets it be rendered from a story or a test without a
 * host. The date is formatted through the active locale rather than the
 * browser's, so it matches the rest of the pane.
 *
 * @example
 * ```tsx
 * <MessageSummary message={message} />
 * ```
 */
export function MessageSummary({ message }: MessageSummaryProps) {
  const { t, language } = useTranslations();
  const received = new Date(message.receivedAt).toLocaleString(language);

  return (
    <Card padding="sm" radius="sm" withBorder>
      <Text fw={600} size="sm">
        {message.subject}
      </Text>
      <Group gap="xs">
        <Text c="dimmed" size="xs">
          {t('from')}
        </Text>
        <Text size="xs">{message.from}</Text>
      </Group>
      <Group gap="xs">
        <Text c="dimmed" size="xs">
          {t('received')}
        </Text>
        <Text size="xs">{received}</Text>
      </Group>
    </Card>
  );
}
