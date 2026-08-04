import { type ElementProps, Stack, type StackProps } from '@mantine/core';

export interface ReportButtonListProps extends StackProps, ElementProps<'div'> {}

/**
 * @description The column the report buttons live in: one under the other, an `md`
 * gap between them. It takes the height of whatever holds it and lets the buttons
 * share it out, which is how they grow to their own `200px` ceiling.
 *
 * The root is a `Stack`, so the gap, the alignment and the rest are set as props —
 * `gap="xl"` opens the column up without a style having to be written for it.
 *
 * @example
 * ```tsx
 * <ReportButtonList>
 *   <ReportButton variant="suspicious" title="Suspicious" description="…" onReport={report} />
 *   <ReportButton variant="spam" title="Spam" description="…" onReport={report} />
 * </ReportButtonList>
 * ```
 */
export function ReportButtonList({ children, ...rest }: ReportButtonListProps): React.ReactElement {
  return (
    <Stack gap="md" w="100%" h="100%" {...rest}>
      {children}
    </Stack>
  );
}

ReportButtonList.displayName = 'ReportButtonList';
