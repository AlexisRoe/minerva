import { Box, Divider, type ElementProps, Stack, type StackProps, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { toTitleCase } from './button-info-content.util';

export interface ButtonInfoEntry {
  /** The label, which sits over its value. */
  label: string;
  /**
   * What the label stands for. Takes a node, for a value that needs marking up.
   * Nothing to show reads `n/a`, so a pair never comes out with an empty line
   * under its label.
   */
  value: ReactNode;
}

export interface ButtonInfoSection {
  /** The heading of the block, above its pairs. */
  title: string;
  /** The pairs under the heading, in the order they should be read. */
  entries: ButtonInfoEntry[];
}

export interface ButtonInfoContentProps extends StackProps, ElementProps<'div'> {
  /** The blocks to draw, top to bottom. An empty array draws nothing at all. */
  sections: ButtonInfoSection[];
}

/**
 * @description The read-only content of the report pane: blocks of label and value
 * pairs, built from data rather than composed by hand. Each block opens with its
 * heading and lists its pairs with the label over the value. A rule closes every
 * block that has another under it — the last one does not get one, so nothing is
 * left dangling at the foot of the panel.
 *
 * The labels are dimmed and their values are not, which leaves the answers as the
 * thing that carries weight while the labels stay out of the way. The headings
 * keep their levels — `h3` for a block, `h4` for a label — while wearing a size
 * that suits a pane this narrow, the way `PageDescription` does with its `h1`.
 *
 * Both are cased on the way in, every word capitalised and the rest lower, so a
 * pane reads evenly however the data it was handed happened to be typed. Only the
 * headings and labels are cased; a value is shown as it came.
 *
 * The root is a `Stack`, so the column the blocks are read down is Mantine's
 * rather than this component's: a caller opens the pane up with `gap="lg"`
 * instead of a style written against it, and the Mantine style props (`m`, `p`,
 * …) all come through as well.
 *
 * @example
 * ```tsx
 * <ButtonInfoContent
 *   sections={[
 *     {
 *       title: 'Sender',
 *       entries: [
 *         { label: 'Display name', value: 'IT Support' },
 *         { label: 'Address', value: 'it-support@example.net' },
 *       ],
 *     },
 *     {
 *       title: 'Message',
 *       entries: [{ label: 'Subject', value: 'Your mailbox is full' }],
 *     },
 *   ]}
 * />
 * ```
 */
export function ButtonInfoContent({ sections, ...rest }: ButtonInfoContentProps) {
  const amount = sections.length;
  const isLast = (index: number): boolean => index === amount - 1;

  return (
    <Stack gap="md" {...rest}>
      {sections.map((section, index) => (
        <Box key={section.title} mb={isLast(index) ? undefined : 'lg'}>
          <Stack component="section" gap="sm">
            <Title order={3} size="h5">
              {toTitleCase(section.title)}
            </Title>

            {section.entries.map((entry) => (
              <Stack key={entry.label} gap="4xs">
                <Title order={4} size="h6" c="dimmed">
                  {toTitleCase(entry.label)}
                </Title>

                <Text size="sm">{entry.value ?? 'n/a'}</Text>
              </Stack>
            ))}
          </Stack>

          {!isLast(index) && <Divider mt="md" />}
        </Box>
      ))}
    </Stack>
  );
}

ButtonInfoContent.displayName = 'ButtonInfoContent';
