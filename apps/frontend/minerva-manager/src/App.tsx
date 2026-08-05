import { useCounter } from '@minerva/ui-lib/hooks';
import { IconRefresh } from '@minerva/ui-lib/icons';
import { Button, Container, Group, Stack, Text, Title } from '@minerva/ui-lib/primitives';

export function App(): React.ReactElement {
  const [refreshes, handlers] = useCounter(0);

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Minerva Manager</Title>
        <Text c="dimmed">Queued email jobs and their processing state.</Text>
        <Group>
          <Button leftSection={<IconRefresh size={18} stroke={1.5} />} onClick={handlers.increment}>
            Refresh
          </Button>
        </Group>
        <Text size="sm">Refreshed {refreshes} times</Text>
      </Stack>
    </Container>
  );
}
