import { Box, Divider, type ElementProps, Flex, type FlexProps, Group, Skeleton, Stack } from '@mantine/core';
import { Fragment } from 'react';

/** The taskpane never gets narrower than this, however tight the window is. */
const taskpaneMinWidth = 220;

/** …and never wider than this, however much room the mail side leaves over. */
const taskpaneMaxWidth = 350;

/** Under this the pane stops following the window down and keeps its own height. */
const taskpaneMinHeight = 400;

/** The command bar above the panes. Named, because the window height is measured off it. */
const ribbonHeight = '3rem';

/** Tall enough for a full-height taskpane with the command bar still above it. */
const windowMinHeight = `calc(${taskpaneMinHeight}px + ${ribbonHeight})`;

/** The gap inside a name-and-detail pair, tight enough that the two lines read as one. */
const pairGap = 6;

/** Mantine has no style prop for overflow, so the panes that clip say so here. */
const clip = { overflow: 'hidden' } as const;

/** …and the taskpane, which scrolls instead of clipping. */
const scroll = { overflowY: 'auto' } as const;

/** Widths of the lines in one block, kept here so every render draws the same mail. */
function lines(...widths: string[]) {
  return widths.map((width, index) => ({ id: `${index}-${width}`, width }));
}

const folderLines = lines('64%', '78%', '52%', '70%', '46%', '60%');
const ribbonActions = lines('72px', '56px', '88px', '64px');
const messageRows = lines('a', 'b', 'c', 'd', 'e');
const bodyLines = lines('94%', '88%', '96%', '72%');
const closingLines = lines('90%', '58%');

/** The row of the message list that stands for the open mail. */
const selectedMessageRow = 1;

/**
 * A skeleton line. Every one of them is static: a shimmer would read as content
 * still loading, when what this stands for is a mail that is already there.
 */
function Line({ w, h = 10 }: { w: number | string; h?: number }) {
  return <Skeleton animate={false} height={h} width={w} radius="sm" />;
}

export interface OutlookWindowProps extends FlexProps, ElementProps<'div'> {
  /** Accessible name of the taskpane region. @default 'Add-in taskpane' */
  taskpaneLabel?: string;
}

/**
 * @description A mail client window with a taskpane docked to its right — the frame
 * an Outlook add-in is seen inside. The mail beside it is skeletons only: a
 * command bar, the folder rail, the message list with the open mail picked out,
 * and the reading pane, drawn just far enough to put a pane in context. It holds
 * no copy of its own, so nothing in it has to be translated.
 *
 * Whatever is passed as `children` becomes the taskpane: between `220px` and
 * `350px` wide, at least `400px` tall, and otherwise as tall as the window. The
 * mail panes give up their width first, so the pane keeps its own as long as it
 * can. The root is a `Flex`, so Mantine style props (`w`, `h`, `mih`, `m`, …) work
 * on it and override the ones set here.
 *
 * @example
 * ```tsx
 * <Box h={620}>
 *   <OutlookWindow>
 *     <ReportPage />
 *   </OutlookWindow>
 * </Box>
 * ```
 */
export function OutlookWindow({ taskpaneLabel = 'Add-in taskpane', children, style, ...rest }: OutlookWindowProps) {
  return (
    <Flex
      direction="column"
      h="100%"
      mih={windowMinHeight}
      bg="var(--mantine-color-body)"
      bd="1px solid var(--mantine-color-default-border)"
      bdrs="md"
      style={[clip, style]}
      {...rest}
    >
      <Group gap="md" wrap="nowrap" px="sm" flex={`0 0 ${ribbonHeight}`}>
        <Line w={84} h={12} />

        <Group gap="xs" wrap="nowrap" flex="1 1 auto" miw={0} style={clip}>
          {ribbonActions.map((action) => (
            <Skeleton key={action.id} animate={false} height={22} width={action.width} radius="sm" />
          ))}
        </Group>

        <Skeleton animate={false} height={24} width={140} radius="xl" />
      </Group>

      <Divider />

      <Flex flex="1 1 auto" mih={0}>
        {/* The folder tree. First to lose its room, so it never pushes the taskpane. */}
        <Stack gap="sm" flex="0 1 168px" miw={0} px="sm" py="md" style={clip}>
          <Line w="46%" h={12} />
          {folderLines.map((folder) => (
            <Line key={folder.id} w={folder.width} />
          ))}
        </Stack>

        <Divider orientation="vertical" />

        <Stack gap={0} flex="0 1 240px" miw={0} style={clip}>
          {messageRows.map((row, index) => (
            <Fragment key={row.id}>
              <Group
                gap="sm"
                wrap="nowrap"
                p="sm"
                // The mail the pane is working on — the one row that is picked out.
                bg={index === selectedMessageRow ? 'var(--mantine-color-default-hover)' : undefined}
              >
                <Skeleton animate={false} circle height={28} />

                <Stack gap={pairGap} flex="1 1 auto" miw={0}>
                  <Line w="68%" />
                  <Line w="92%" h={8} />
                </Stack>
              </Group>

              <Divider />
            </Fragment>
          ))}
        </Stack>

        <Divider orientation="vertical" />

        <Stack gap="md" flex="1 1 auto" miw={0} p="lg" style={clip}>
          <Line w="58%" h={16} />

          <Group gap="sm" wrap="nowrap">
            <Skeleton animate={false} circle height={36} />

            <Stack gap={pairGap} flex="1 1 auto" miw={0}>
              <Line w="42%" />
              <Line w="30%" h={8} />
            </Stack>
          </Group>

          <Stack gap="xs">
            {bodyLines.map((line) => (
              <Line key={line.id} w={line.width} />
            ))}
          </Stack>

          <Stack gap="xs">
            {closingLines.map((line) => (
              <Line key={line.id} w={line.width} />
            ))}
          </Stack>
        </Stack>

        <Divider orientation="vertical" />

        {/* Takes what is left up to its ceiling, and gives room back down to its floor. */}
        <Box
          component="aside"
          aria-label={taskpaneLabel}
          flex={`1 1 ${taskpaneMaxWidth}px`}
          miw={taskpaneMinWidth}
          maw={taskpaneMaxWidth}
          mih={taskpaneMinHeight}
          bg="var(--mantine-color-body)"
          style={scroll}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

OutlookWindow.displayName = 'OutlookWindow';
