import { useDisclosure } from '@minerva/ui-lib/hooks';
import { IconMail } from '@minerva/ui-lib/icons';
import { Button, Stack, Text, Title } from '@minerva/ui-lib/primitives';

import { I18nProvider, useTranslations } from './i18n';

/** The pane's content; separate so it renders under {@link I18nProvider}. */
function TaskPane() {
  const [submitted, { open }] = useDisclosure(false);
  const { t } = useTranslations();

  return (
    <Stack gap="sm" p="md">
      <Title order={2}>{t('title')}</Title>
      <Text size="sm" c="dimmed">
        {t('intro')}
      </Text>
      <Button leftSection={<IconMail size={18} stroke={1.5} />} onClick={open}>
        {t('submit')}
      </Button>
      {submitted ? <Text size="sm">{t('queued')}</Text> : null}
    </Stack>
  );
}

/** The task-pane surface hosted inside Outlook. */
export function App() {
  return (
    <I18nProvider>
      <TaskPane />
    </I18nProvider>
  );
}
