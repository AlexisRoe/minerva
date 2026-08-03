import { useDisclosure } from '@minerva/ui-lib/hooks';
import { IconMail } from '@minerva/ui-lib/icons';
import { Button, Stack, Text, Title } from '@minerva/ui-lib/primitives';

/** The task-pane surface hosted inside Outlook. */
export function App() {
  const [submitted, { open }] = useDisclosure(false);

  return (
    <Stack gap="sm" p="md">
      <Title order={2}>Minerva</Title>
      <Text size="sm" c="dimmed">
        Send the open message to Minerva for processing.
      </Text>
      <Button leftSection={<IconMail size={18} stroke={1.5} />} onClick={open}>
        Send to Minerva
      </Button>
      {submitted ? <Text size="sm">Queued for processing.</Text> : null}
    </Stack>
  );
}
