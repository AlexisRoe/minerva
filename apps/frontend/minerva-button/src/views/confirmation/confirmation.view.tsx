import { IconMail } from '@minerva/ui-lib/icons';
import { Button, Text, Title } from '@minerva/ui-lib/primitives';
import { useNavigate } from 'react-router';

import { useTranslations } from '../../i18n';
import { ROUTES } from '../../routing';

/**
 * Shown once Minerva has accepted a message.
 *
 * A screen rather than a flag on the task pane: the pane stays open after a
 * submission, and the user needs an unambiguous end state they can leave from.
 * It reads nothing -- the receipt is the previous screen's concern.
 *
 * @example
 * ```tsx
 * { path: ROUTES.confirmation, Component: ConfirmationView }
 * ```
 */
export function ConfirmationView() {
  const { t } = useTranslations();
  const navigate = useNavigate();

  return (
    <>
      <Title order={2}>{t('confirmation-title')}</Title>
      <Text c="dimmed" size="sm">
        {t('confirmation-body')}
      </Text>
      <Button
        leftSection={<IconMail size={18} stroke={1.5} />}
        onClick={() => void navigate(ROUTES.taskPane)}
        variant="light"
      >
        {t('back')}
      </Button>
    </>
  );
}
