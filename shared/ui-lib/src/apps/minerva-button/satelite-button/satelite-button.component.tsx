import { ActionIcon, type ActionIconProps, type ElementProps } from '@mantine/core';
import { IconSatellite } from '@tabler/icons-react';
import type { CSSProperties } from 'react';

/**
 * Hover turns the button inside out: the mark's own colour becomes the surface,
 * and the mark takes the colour of the page behind it. Both sides are read off
 * the button rather than fixed here, so `color` carries through the swap — a red
 * button inverts to red, and the icon comes back as the body colour it sat on.
 */
const invertOnHover = {
  '--ai-hover': 'var(--ai-color)',
  '--ai-hover-color': 'var(--mantine-color-body)',
} as CSSProperties;

/** The box is the mark plus the room the hover fill needs around it. */
function boxSize(iconSize: number | string) {
  const icon = typeof iconSize === 'number' ? `${iconSize}px` : iconSize;

  return `calc(${icon} + 0.75rem)`;
}

export interface SateliteButtonProps extends Omit<ActionIconProps, 'variant'>, ElementProps<'button', 'color'> {
  /** Accessible name of the button, since the icon is all it shows. @default 'Satelite' */
  label?: string;
  /** Side of the icon, as a CSS length or a number of px. @default '1.5rem' */
  iconSize?: number | string;
}

/**
 * @description The satellite mark on its own: at rest there is no background and
 * no border, just the icon on whatever it sits on. Under the cursor it inverts —
 * the mark's colour fills a disc behind it and the icon drops out of that — so it
 * answers the pointer the way a button does instead of leaving you to guess that
 * it is live.
 *
 * It is built on `ActionIcon` rather than `Button` on purpose — a `Button` keeps
 * a padded, 36px-tall pill whatever it is painted, which is the opposite of bare.
 * The box is the mark plus just enough room for the inverted fill to land in, so
 * it still sits in a line of content without pushing it around.
 *
 * The look is fixed — the Mantine `variant` is not taken, so it cannot be turned
 * into a filled button by accident. Everything else an `ActionIcon` accepts still
 * applies: `color` (which both sides of the inversion follow), `disabled`,
 * `onClick`, `size` to override the box, and `radius` to square the disc off.
 *
 * @example
 * ```tsx
 * <SateliteButton label="Scan this mail" onClick={() => scan()} />
 * ```
 */
export function SateliteButton({
  label = 'Satelite',
  iconSize = '1.5rem',
  size = boxSize(iconSize),
  radius = '50%',
  style,
  ...rest
}: SateliteButtonProps) {
  return (
    <ActionIcon
      variant="transparent"
      size={size}
      radius={radius}
      aria-label={label}
      style={{ ...invertOnHover, ...style }}
      {...rest}
    >
      <IconSatellite size={iconSize} stroke={1.5} aria-hidden />
    </ActionIcon>
  );
}

SateliteButton.displayName = 'SateliteButton';
