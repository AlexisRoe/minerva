import { type ElementProps, Stack, type StackProps, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export interface PageDescriptionProps extends Omit<StackProps, 'title'>, ElementProps<'div', 'title'> {
  /** The page heading. Rendered as the `h1`, so a page carries exactly one. */
  title: ReactNode;
  /** The line under the heading, saying what the page is for. */
  description: ReactNode;
}

/**
 * @description The heading block of a page: its title above a short description.
 * The title is the page's `h1` — its one top-level heading — but wears the size
 * of an `h3`, so the semantics stay right without the type shouting.
 *
 * The root is a `Stack`, so the column it draws is Mantine's rather than this
 * component's: the gap is a prop like any other, and a caller opens the block up
 * with `gap="md"` instead of a style written against it.
 *
 * @example
 * ```tsx
 * <PageDescription title="Report" description="Everything the last run turned up." />
 * ```
 */
export function PageDescription({ title, description, ...rest }: PageDescriptionProps) {
  return (
    <Stack gap="2xs" {...rest}>
      <Title order={1} size="h3">
        {title}
      </Title>

      <Text size="sm" c="dimmed">
        {description}
      </Text>
    </Stack>
  );
}

PageDescription.displayName = 'PageDescription';
