import { Box, Center, type CenterProps, type ElementProps, Text, VisuallyHidden } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';

/** Height of one row of the reel: room for a line that wraps to two, and no more. */
const rowHeight = 52;

/** How much of the reel is on show — the row it is on, with one either side of it. */
const defaultVisibleRows = 3;

/** How long a step stays put before the reel moves on, in milliseconds. */
const defaultIntervalMs = 1800;

/** How long the reel takes to travel one row, in milliseconds. */
const defaultTransitionMs = 500;

/** It sets off and settles rather than sliding at one speed, the way a reel does. */
const easing = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** How long a row takes to light up as it arrives, and to fade as it leaves. */
const rowFade = '0.4s ease';

/**
 * What it says when nobody has said what it is waiting for. Three of them, because
 * three rows are on show: the reel turns, and every row reads the same, so it is a
 * spinner made of words rather than a list of anything.
 */
const defaultSteps = ['loading ...', 'loading ...', 'loading ...'];

/** How wide a row's text may run before it wraps, leaving the ends of the row clear. */
const labelWidth = '75%';

/** The row it is on is the one being read; the rest are only there to show it moving. */
const restingOpacity = 0.35;

/** The room left around the reel, so it never sits against the edges of its parent. */
const outerSpacing = 'xl';

/**
 * What is left for a style to say. The reel's own heights stay in pixels rather
 * than becoming size props: a size prop is taken to `rem` and scaled with the
 * theme, while the distance the reel travels is worked out here in pixels — the
 * two have to agree, or the rows stop landing where the window is. The rest is
 * what no prop reaches: the clipping, the wrapping, and the fades.
 */
const clipStyle = { overflow: 'hidden' } as const;

const labelStyle = {
  wordBreak: 'break-word',
  transition: `opacity ${rowFade}, color ${rowFade}`,
} as const;

export interface LoadingIndicatorProps extends CenterProps, ElementProps<'div'> {
  /**
   * What it works through while it waits. Every string is the caller's, in
   * whatever language it has to hand.
   *
   * @default ['loading ...', 'loading ...', 'loading ...']
   */
  steps?: string[];
  /** How long each step stays on screen before the reel moves on, in milliseconds. */
  intervalMs?: number;
  /** How many rows of the reel are on show at once. An odd number keeps one centred. */
  visibleRows?: number;
  /** How long the reel takes to travel one row, in milliseconds. */
  transitionMs?: number;
}

/** One row of the reel, tied to the copy of the list it belongs to rather than its place in the DOM. */
interface ReelRow {
  id: string;
  step: string;
}

/**
 * Three copies of the list, so there is always a copy above and a copy below the
 * one being read and the reel never runs out of rows to scroll into.
 */
function loopRows(steps: string[]): ReelRow[] {
  return [0, 1, 2].flatMap((copy) => steps.map((step, index) => ({ id: `${copy}-${index}`, step })));
}

/**
 * @description A reel of loading steps: one row lit in the middle, the rest dimmed
 * above and below it, turning to the next step every so often. It is a spinner
 * that says something — for a wait long enough that a circle going round would only
 * say that nothing has crashed.
 *
 * It takes the full width of whatever it is put in and sits in the middle of it, so
 * it wants a parent with a height — the content row of a page, a panel — and nothing
 * else.
 *
 * The list is its own; left alone it says `loading ...` and turns. Give it steps and
 * it works through them in order, over and over, and the row it is on is announced
 * to a screen reader while the reel itself is left out of the accessibility tree —
 * a scrolling list of three rows is nothing to read out.
 *
 * The root is a `Center`, so the centring and the room around the reel are
 * Mantine's rather than this component's: a caller closes the margins up with
 * `p="xs"`, or takes the reel off the middle of the page with a prop, without a
 * style having to be written against it.
 *
 * @example
 * ```tsx
 * <LoadingIndicator />
 *
 * <LoadingIndicator
 *   steps={['Connecting to Outlook', 'Syncing mailbox data', 'Almost ready']}
 *   intervalMs={1200}
 * />
 * ```
 */
export function LoadingIndicator({
  steps = defaultSteps,
  intervalMs = defaultIntervalMs,
  visibleRows = defaultVisibleRows,
  transitionMs = defaultTransitionMs,
  ...rest
}: LoadingIndicatorProps): React.ReactElement | null {
  const total = steps.length;
  const rows = useMemo(() => loopRows(steps), [steps]);

  const [current, setCurrent] = useState(total);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    setCurrent(total);
    setIsMoving(false);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setIsMoving(true);
      setCurrent((value) => value + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [total, intervalMs]);

  useEffect(() => {
    if (total === 0 || current < total * 2) return;

    const timer = setTimeout(() => {
      setIsMoving(false);
      setCurrent((value) => value - total);
    }, transitionMs);

    return () => clearTimeout(timer);
  }, [current, total, transitionMs]);

  if (total === 0) return null;

  const viewportHeight = rowHeight * visibleRows;
  const offset = viewportHeight / 2 - (current * rowHeight + rowHeight / 2);

  return (
    <Center w="100%" h="100%" p={outerSpacing} {...rest}>
      <Box pos="relative" w="100%" style={{ ...clipStyle, height: viewportHeight }} aria-hidden>
        <Box
          pos="absolute"
          left={0}
          right={0}
          style={{
            transform: `translateY(${offset}px)`,
            transition: isMoving ? `transform ${transitionMs}ms ${easing}` : 'none',
          }}
        >
          {rows.map((row, index) => (
            <Center key={row.id} style={{ height: rowHeight }}>
              <Text
                dir="auto"
                ta="center"
                maw={labelWidth}
                lh={1.1}
                lineClamp={2}
                c={index === current ? undefined : 'dimmed'}
                opacity={index === current ? 1 : restingOpacity}
                style={labelStyle}
              >
                {row.step}
              </Text>
            </Center>
          ))}
        </Box>
      </Box>

      <VisuallyHidden role="status">{steps[current % total]}</VisuallyHidden>
    </Center>
  );
}

LoadingIndicator.displayName = 'LoadingIndicator';
