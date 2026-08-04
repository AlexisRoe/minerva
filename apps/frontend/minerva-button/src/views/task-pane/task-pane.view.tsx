import { IconMail } from '@minerva/ui-lib/icons';
import { Button, Text, Title } from '@minerva/ui-lib/primitives';
import { useNavigate } from 'react-router';

import { useCurrentMessage } from '../../adapters/office';
import { MessageSummary } from '../../components/message-summary/message-summary.component';
import { useTranslations } from '../../i18n';
import { ROUTES } from '../../routing';

/**
 * The pane's landing screen: what is open, and a way on from it.
 *
 * A placeholder, and knowingly so. It shows that the Office adapter works end to
 * end in a real pane, which is worth keeping until there is something better to
 * look at -- but the screen the product actually wants here is the report page,
 * with its drawers and its reporting reasons, and that replaces this view
 * outright rather than growing out of it.
 *
 * It deliberately no longer submits anything. The work-item endpoint it used to
 * post to never existed on the API, so the button now only navigates: reporting
 * runs through a router action against the Minerva adapter, not through a view.
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

  async function handleSubmit(): Promise<void> {
    if (!message) {
      return;
    }

    await navigate(ROUTES.confirmation);
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
        loading={isLoading}
        onClick={handleSubmit}
      >
        {t('submit')}
      </Button>
    </>
  );
}
