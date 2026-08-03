import {
  getSize,
  EmptyState as MantineEmptyState,
  type EmptyStateProps as MantineEmptyStateProps,
} from '@mantine/core';
import { type Icon, IconInbox } from '@tabler/icons-react';
import type { ReactNode } from 'react';

const iconStroke = 1.5;

/**
 * How much bigger the mark is drawn than the size it is given. Standing on its own,
 * with nothing behind it to lend it weight, Mantine's own size reads small at the
 * top of the block — this puts it back in proportion with the title under it.
 */
const iconScale = 1.35;

/**
 * The two variables Mantine sizes and colours the indicator from, set on the root
 * rather than reached for through `styles`: the size scaled off whatever `size` the
 * block is given, and the colour left alone wherever a `variant` has already
 * decided it.
 */
const indicatorVars: MantineEmptyStateProps['vars'] = (_theme, { size, variant }) => ({
  root: {
    '--empty-state-indicator-size': `calc(${getSize(size, 'empty-state-indicator-size')} * ${iconScale})`,
    '--empty-state-indicator-color': variant ? undefined : 'var(--mantine-primary-color-filled)',
  },
});

/**
 * The one thing the block adds to the layout Mantine already gives it: it stands in
 * for content, so it sits in the middle of the room it takes. The height and the
 * padding are style props, and the centring across is left to `align`, so a caller
 * can still move any of it.
 */
const centreDown = { justifyContent: 'center' } as const;

export interface EmptyStateProps extends Omit<MantineEmptyStateProps, 'icon'> {
  /** Any Tabler icon component; defaults to `IconInbox`. */
  icon?: Icon;
  /** What to do about it — a button, a link. Sits under the text. */
  action?: ReactNode;
}

/**
 * @description Mantine's `EmptyState` with the house defaults on it: a Tabler icon
 * drawn bare and a shade larger than Mantine draws it, set at the size the taskpane
 * reads in, and the height behaviour it does not have of its own. It centres itself
 * in whatever it is given, so it wants a parent with a height — the content row of
 * a page, a panel.
 *
 * Everything an `EmptyState` takes still applies: `title`, `description`, `size`,
 * `align`, `color` and the rest. The height and the padding are Mantine style
 * props, so `h` and `p` of a caller's own override them. Passing a `variant` puts
 * the circle back behind the icon, in the colour it is given.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No reports yet"
 *   description="Anything you report from a mail shows up here."
 *   action={<ActionButton label="Report this mail" />}
 * />
 * ```
 */
export function EmptyState({
  icon: IconComponent = IconInbox,
  action,
  size = 'sm',
  style,
  children,
  ...rest
}: EmptyStateProps) {
  return (
    <MantineEmptyState
      icon={<IconComponent stroke={iconStroke} aria-hidden />}
      size={size}
      h="100%"
      p="xl"
      style={[centreDown, style]}
      vars={indicatorVars}
      withIndicatorBackground={false}
      {...rest}
    >
      {children}
      {action ? <MantineEmptyState.Actions>{action}</MantineEmptyState.Actions> : null}
    </MantineEmptyState>
  );
}

EmptyState.displayName = 'EmptyState';
