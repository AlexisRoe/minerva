import { Box, type BoxProps, type ElementProps, type MantineSpacing, rem, Text } from '@mantine/core';
import minervaLogoUrl from '../../assets/minerva-logo.svg';

/** The title never sits closer to the mark than this, whatever `gap` asks for. */
const MIN_GAP = '0.75rem';

const SPACING_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Share of the font size a capital of the brand font (DM Sans) actually fills.
 * Dividing by it scales the title until its capitals stand as tall as the mark,
 * and using it as the line height keeps the line box that same height.
 */
const CAP_HEIGHT_RATIO = 0.7;

const rootStyle = {
  display: 'inline-flex',
  alignItems: 'center',
};

const markStyle = {
  display: 'block',
  flexShrink: 0,
};

const titleStyle = {
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
};

/**
 * Resolves `gap` to a CSS length and floors it at {@link MIN_GAP}. Mantine spacing
 * keys become their CSS variable, so `max()` can compare them at paint time.
 */
function resolveGap(gap: MantineSpacing | undefined): string {
  if (gap === undefined) {
    return MIN_GAP;
  }

  const value = typeof gap === 'number' ? rem(gap) : SPACING_KEYS.includes(gap) ? `var(--mantine-spacing-${gap})` : gap;

  return `max(${MIN_GAP}, ${value})`;
}

/** Sizes the title off the mark: capitals exactly `size` tall, in a line box of the same height. */
function resolveTitleHeight(size: number | string) {
  return {
    fontSize: `calc(${rem(size)} / ${CAP_HEIGHT_RATIO} / 2)`,
    lineHeight: CAP_HEIGHT_RATIO,
  };
}

export interface BrandLogoProps extends BoxProps, ElementProps<'div', 'title'> {
  /** Edge length of the square mark, which the title matches in height; a number is read as pixels. @default 40 */
  size?: number | string;
  /** Renders the title to the right of the mark. Turn it off for the bare mark. @default true */
  withTitle?: boolean;
  /** The wordmark next to the mark, always uppercased. @default 'Minerva' */
  title?: string;
  /** Space between mark and title. Never renders below `0.75rem`. @default '0.75rem' */
  gap?: MantineSpacing;
  /** Accessible name of the bare mark. Ignored while the title is visible — that text names the logo. @default 'Minerva Logo' */
  alt?: string;
}

/**
 * @description The Minerva logo: the brand mark, then the uppercase title to its
 * right. The mark is `src/assets/minerva-logo.svg` rendered as an image, so the
 * artwork lives in exactly one place. The title scales with `size`, so its
 * capitals stand as tall as the mark beside them. The root is a `Box`, so
 * Mantine style props (`m`, `pos`, …) work on it.
 *
 * The visible title is what screen readers announce, and the mark beside it
 * stays decorative. Drop it with `withTitle={false}` and the mark takes the name
 * over, from `alt`.
 *
 * @example
 * ```tsx
 * <BrandLogo />                             // ◯ MINERVA
 * <BrandLogo title="Minerva Manager" />     // ◯ MINERVA MANAGER
 * <BrandLogo withTitle={false} size={24} /> // the bare mark, labelled "Minerva Logo"
 * ```
 */
export function BrandLogo({
  size = 40,
  withTitle = true,
  title = 'Minerva',
  gap,
  alt = 'Minerva Logo',
  style,
  ...rest
}: BrandLogoProps) {
  const hasTitle = withTitle && title !== '';

  return (
    <Box style={[rootStyle, { gap: resolveGap(gap) }, style]} {...rest}>
      <Box component="img" src={minervaLogoUrl} alt={hasTitle ? '' : alt} w={size} h={size} style={markStyle} />

      {hasTitle ? (
        <Text component="span" fw={700} tt="uppercase" style={[titleStyle, resolveTitleHeight(size)]}>
          {title}
        </Text>
      ) : null}
    </Box>
  );
}

BrandLogo.displayName = 'BrandLogo';
