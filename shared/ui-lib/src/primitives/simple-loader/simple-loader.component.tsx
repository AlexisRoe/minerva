import { Box, Center, type CenterProps, type ElementProps } from '@mantine/core';

import classes from './simple-loader.module.css';

export interface SimpleLoaderProps extends CenterProps, ElementProps<'div'> {
  /**
   * What a reader who cannot see it spinning is told instead. It is what the
   * loader is announced by, so it says what is being waited on where more than
   * one thing can be.
   */
  label?: string;
}

/**
 * @description The CSS-only loader from the Mantine docs: two balls chasing each
 * other round a box, drawn from a single span and its pseudo elements rather
 * than from an SVG or a component tree.
 *
 * It sits in the middle of whatever it is put in, across and down, so a pane
 * that is waiting on something shows it in the middle of the pane — the root is
 * a `Center` filling the room it is given, which means it wants a parent with a
 * height to fill.
 *
 * The colours are the theme's greys rather than the demo's white and orange,
 * and they move up the scale in the dark scheme so the pair reads either way.
 * Those, the size and the speed are CSS variables set on the root, so a `style`
 * of a caller's own overrides them: `--loader-unit` scales the whole thing,
 * `--loader-duration` sets how long a turn takes, and `--loader-color-lead` and
 * `--loader-color-trail` colour the two balls.
 *
 * The Mantine style props all come through to the root, so the box it centres
 * in is set with `h`, `mih` and the rest.
 *
 * @example
 * ```tsx
 * <SimpleLoader label="Loading your reports" mih={240} />
 * ```
 */
export function SimpleLoader({ label = 'Loading', className, ...rest }: SimpleLoaderProps): React.ReactElement {
  return (
    <Center className={[classes.root, className].filter(Boolean).join(' ')} w="100%" h="100%" {...rest}>
      <Box component="span" className={classes.loader} role="status" aria-label={label} />
    </Center>
  );
}

SimpleLoader.displayName = 'SimpleLoader';
