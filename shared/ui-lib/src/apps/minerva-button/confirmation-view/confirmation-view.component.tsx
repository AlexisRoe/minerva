import { Divider, type ElementProps, List, Stack, type StackProps, Text, Title } from '@mantine/core';
import { IconMailbox } from '@tabler/icons-react';
import type { ReactNode } from 'react';

/** The step the blocks of the page are set apart by. */
const blockGap = 'xs';

/** What the sections are set apart by inside themselves, rules included. */
const sectionGap = 'sm';

const bodySize = 'sm';

export interface ConfirmationViewProps extends Omit<StackProps, 'title'>, ElementProps<'div', 'title'> {
  /** What has just happened, said in a line. Drawn as the page's `h1`. */
  title: ReactNode;
  /** What it means for the person reading it. Takes a string or an element. */
  description?: ReactNode;
  /** Where the mail itself ended up. Without one, no section is drawn for it. */
  statusMessage?: ReactNode;
  /** What the list is about, drawn as an `h2`. Only shown where there is a list. */
  detailsTitle?: ReactNode;
  /** What follows from here, a line each. Without any, no section is drawn. */
  details?: string[];
}

/**
 * @description The pane after a mail has been reported: the mailbox over what
 * happened, the line explaining it, and — where there is anything to add — up to
 * two sections under it.
 *
 * The first says where the mail itself ended up, under a rule across the pane;
 * the second lists what follows from here, under a heading of its own. Both read
 * down the left where the copy above them is centred, and both are left out
 * rather than held open when they have nothing to say — so the same view serves
 * a report that is simply done and one the reader still has something to do
 * about.
 *
 * The headings are real ones: the title is the `h1` of the page, and the list
 * heading the `h2` under it, so the pane can be read by its outline.
 *
 * It fills the width and the height it is given, so it wants a parent with one —
 * the content row of a page. The root is a `Stack`, so the column it draws is
 * Mantine's rather than this component's: a caller opens the page up with
 * `gap="md"`, or takes it off the top with `justify="center"`, without a style
 * having to be written against it. The Mantine style props all come through.
 *
 * @example
 * ```tsx
 * <ConfirmationView
 *   title="Thanks for reporting"
 *   description="The mail is on its way to the security team."
 *   statusMessage="It has been moved out of your inbox."
 *   detailsTitle="What happens next"
 *   details={['The team looks at the mail.', 'You hear back only if they need you.']}
 * />
 * ```
 */
export function ConfirmationView({
  title,
  description,
  statusMessage,
  detailsTitle,
  details,
  style,
  ...rest
}: ConfirmationViewProps): React.ReactElement {
  const hasDetails = Boolean(details?.length);

  return (
    <Stack
      align="center"
      justify="flex-start"
      gap={blockGap}
      w="100%"
      h="100%"
      style={[{ overflowY: 'auto' }, style]}
      {...rest}
    >
      <IconMailbox
        size={86}
        stroke={1.5}
        style={{ color: 'var(--mantine-primary-color-filled)', flexShrink: 0 }}
        aria-hidden
      />

      <Stack align="center" gap={blockGap} w="100%" miw={0} ta="center">
        <Title order={1} fz="md" fw={600} lh={1.3} c="bright" m={0}>
          {title}
        </Title>

        {description && (
          <Text size={bodySize} c="dimmed" lh={1.55} maw="32rem" m={0}>
            {description}
          </Text>
        )}

        {statusMessage && (
          <Stack component="section" w="100%" gap={sectionGap} ta="start">
            {/* What sets the rule off from the copy it closes. */}
            <Divider mt="1.5rem" />
            <Text size={bodySize}>{statusMessage}</Text>
          </Stack>
        )}

        {hasDetails && (
          <Stack component="section" w="100%" gap={sectionGap} ta="start" mt={blockGap}>
            {detailsTitle && (
              <Title order={2} size="sm">
                {detailsTitle}
              </Title>
            )}

            <List size={bodySize} spacing="xs">
              {details?.map((detail) => (
                <List.Item key={detail}>{detail}</List.Item>
              ))}
            </List>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

ConfirmationView.displayName = 'ConfirmationView';
