import { IconMail } from '@minerva/ui-lib/icons';
import { Button, Text, Title } from '@minerva/ui-lib/primitives';
import { useNavigate } from 'react-router';

import { useSubmitWorkItem } from '../../adapters/minerva';
import { useCurrentMessage } from '../../adapters/office';
import { MessageSummary } from '../../components/message-summary/message-summary.component';
import { useTranslations } from '../../i18n';
import { ROUTES } from '../../routing';

/**
 * The pane's landing screen: what is open, and the button that submits it.
 *
 * All three adapters meet here and nowhere else -- the view reads the message
 * through the Office hook and writes through the Minerva one, without knowing
 * that one is a global and the other a `fetch`. The body still comes from the
 * fixed text below; wiring the Graph hook in is what replaces it.
 *
 * @example
 * ```tsx
 * { index: true, Component: TaskPaneView }
 * ```
 */
export function TaskPaneView() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const { message, isLoading } = useCurrentMessage();
  const { submit, isSubmitting } = useSubmitWorkItem();

  async function handleSubmit(): Promise<void> {
    if (!message) {
      return;
    }

    const receipt = await submit({
      messageId: message.id,
      subject: message.subject,
      from: message.from,
      body: '',
    });

    await navigate(receipt ? ROUTES.confirmation : ROUTES.error);
  }

  return (
    <>
      <Title order={2}>{t('title')}</Title>
      <Text c="dimmed" size="sm">
        {t('intro')}
      </Text>

      {message ? <MessageSummary message={message} /> : null}
      {!message && !isLoading ? <Text size="sm">{t('no-message')}</Text> : null}

      <Button
        disabled={!message}
        leftSection={<IconMail size={18} stroke={1.5} />}
        loading={isLoading || isSubmitting}
        onClick={handleSubmit}
      >
        {t('submit')}
      </Button>
    </>
  );
}
