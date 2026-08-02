import { Box, Group, Stack, Text, Title } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconReportAnalytics } from '@tabler/icons-react';

import { ActionButton } from '../../../primitives/action-button/action-button.example';
import { ReportButtonPage } from './report-button-page.component';

/**
 * The page is `height: 100%`, so it needs an ancestor with a height to fill.
 * This frame stands in for the app shell it is mounted into.
 */
const meta = {
  title: 'MinervaButton/ReportButtonPage',
  component: ReportButtonPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box
        h={460}
        style={{
          border: '1px dashed var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
        }}
      >
        <Story />
      </Box>
    ),
  ],
  args: {
    children: (
      <>
        <ReportButtonPage.Header>
          <Group gap="xs">
            <IconReportAnalytics size={20} stroke={1.5} />
            <Title order={2}>Report</Title>
          </Group>
          <ActionButton label="Send report" />
        </ReportButtonPage.Header>

        <ReportButtonPage.Content>
          <Stack gap="xs">
            <Text size="sm">The two bands keep their height, the content takes everything between them.</Text>
            <Text size="sm" c="dimmed">
              Both are dressed in the fill and the rule the drawer's header is drawn with, so a page and a panel are of
              a piece.
            </Text>
          </Stack>
        </ReportButtonPage.Content>
      </>
    ),
  },
} satisfies Meta<typeof ReportButtonPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With a footer the page has a way on from it, pinned under the content. */
export const WithFooter: Story = {
  args: {
    children: (
      <>
        <ReportButtonPage.Header>
          <Title order={2}>Report</Title>
        </ReportButtonPage.Header>

        <ReportButtonPage.Content>
          <Text size="sm">The footer stays put while this scrolls under it.</Text>
        </ReportButtonPage.Content>

        <ReportButtonPage.Footer>
          <Text size="sm" c="dimmed">
            Step 1 of 2
          </Text>
          <ActionButton label="Send report" />
        </ReportButtonPage.Footer>
      </>
    ),
  },
};

/** The content is the part that grows, and the only one that moves. */
export const ScrollingContent: Story = {
  args: {
    children: (
      <>
        <ReportButtonPage.Header>
          <Title order={2}>Report</Title>
        </ReportButtonPage.Header>

        <ReportButtonPage.Content>
          <Stack gap="sm">
            {Array.from({ length: 20 }, (_, index) => `Row ${index + 1}`).map((row) => (
              <Text key={row} size="sm">
                {row} — scrolls between the two bands.
              </Text>
            ))}
          </Stack>
        </ReportButtonPage.Content>

        <ReportButtonPage.Footer>
          <ActionButton label="Send report" />
        </ReportButtonPage.Footer>
      </>
    ),
  },
};

/** Every part takes the props of the Mantine component under it, padding included. */
export const CustomPadding: Story = {
  args: {
    children: (
      <>
        <ReportButtonPage.Header p="3xl">
          <Title order={2}>Report</Title>
          <ActionButton label="Send report" />
        </ReportButtonPage.Header>

        <ReportButtonPage.Content p="3xl">
          <Text size="sm">A page with more room around its bands than the house step.</Text>
        </ReportButtonPage.Content>
      </>
    ),
  },
};

/** Without a `Header` the content simply starts at the top of the page. */
export const ContentOnly: Story = {
  args: {
    children: (
      <ReportButtonPage.Content>
        <Text size="sm">A report page with nothing above the fold.</Text>
      </ReportButtonPage.Content>
    ),
  },
};
