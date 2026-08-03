import { Button, type ButtonProps, type ElementProps, Stack, Text, Title } from '@mantine/core';
import { type Icon, IconMailExclamation, IconMailFast } from '@tabler/icons-react';
import type { MouseEvent, ReactNode } from 'react';

/** What the message is being reported as. */
export type ReportButtonVariant = 'suspicious' | 'spam';

/** Each report stands for a kind of mail, so each variant brings its own envelope. */
const variantIcons: Record<ReportButtonVariant, Icon> = {
  suspicious: IconMailExclamation,
  spam: IconMailFast,
};

/**
 * The room inside the button: the padding around the content, and the gap between
 * its two columns. A theme step rather than a number, so the button keeps the
 * rhythm of the rest. The padding goes on as a prop; the gap belongs to the label
 * element, which is reached through `styles` and so takes the variable itself.
 */
const innerSpacing = 'md';
const innerGap = `var(--mantine-spacing-${innerSpacing})`;

/** However much room the list hands it, the button stops growing here. */
const maxHeight = '200px';

/** The gap between the title and the line under it — the two are one block. */
const textGap = '3xs';

/** Big enough to read as the button's face rather than a bullet beside the text. */
const iconSize = 48;

/**
 * The description is the quiet half of the pair. It is held back by thinning the
 * button's own colour rather than by the dimmed token, because an outline button
 * turns its colours over under the pointer: the icon and the title follow it there
 * on `currentColor` alone, and a colour of its own would leave this line behind on
 * the fill that has just moved under it. Thinned, it turns over with the rest and
 * stays the same distance back on either side of the swap.
 */
const descriptionOpacity = 0.6;

/**
 * The two sections inside the button. Neither is the root, so neither can be
 * reached by a prop — they are the Styles API's to set, and are the only styles
 * this component still writes out by hand.
 */
const innerStyle = {
  // Hold the full height, so the content can centre in it.
  width: '100%',
  height: '100%',
} as const;

const contentStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: innerGap,
  width: '100%',
  height: '100%',
  // A button label is one line by default; the description needs to wrap out of it.
  whiteSpace: 'normal',
  overflow: 'visible',
} as const;

export interface ReportButtonProps extends Omit<ButtonProps, 'variant'>, ElementProps<'button', 'title' | 'color'> {
  /** Which report this button files. Picks the icon, and is what {@link ReportButtonProps.onReport} is handed. */
  variant: ReportButtonVariant;
  /** The heading of the button. Rendered as an `h2`, sized like an `h5`. */
  title: ReactNode;
  /** The line under the heading, saying what filing this report means. */
  description: ReactNode;
  /** Called with this button's variant when it is clicked. */
  onReport?: (variant: ReportButtonVariant) => void;
}

/**
 * @description A full-width outline button for filing one report: its icon in the
 * left column, its title and description in the right one, the pair centred in
 * whatever height the button has. It grows into the room it is offered and stops
 * at `200px`. Clicking it hands its `variant` to `onReport`, so one handler can
 * serve every button in a list.
 *
 * The variant names the report, not the Mantine variant — the outline look is
 * fixed. It lands on the DOM as `data-report-variant`. Under the pointer that
 * outline turns over, the theme's doing rather than this component's: the fill
 * goes dark and the icon, the title and the description all come up light with it.
 *
 * The root is a `Button`, and its layout is set in Mantine style props — so a
 * caller changes the size or the padding with a prop of their own (`mah="120px"`,
 * `p="lg"`) rather than with a style. Those props are inline styles, and beat a
 * `style` for the same property.
 *
 * @example
 * ```tsx
 * <ReportButton
 *   variant="spam"
 *   title="Spam"
 *   description="Bulk mail nobody asked for."
 *   onReport={(variant) => report(variant)}
 * />
 * ```
 */
export function ReportButton({ variant, title, description, onReport, onClick, ...rest }: ReportButtonProps) {
  const VariantIcon = variantIcons[variant];

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    onReport?.(variant);
  }

  return (
    <Button
      variant="outline"
      data-report-variant={variant}
      onClick={handleClick}
      display="block"
      w="100%"
      h="100%"
      mah={maxHeight}
      flex="1 1 auto"
      p={innerSpacing}
      ta="left"
      styles={{ inner: innerStyle, label: contentStyle }}
      {...rest}
    >
      <VariantIcon size={iconSize} stroke={1.5} aria-hidden />

      <Stack gap={textGap} miw={0}>
        <Title order={2} size="h5">
          {title}
        </Title>

        <Text size="sm" c="inherit" opacity={descriptionOpacity}>
          {description}
        </Text>
      </Stack>
    </Button>
  );
}

ReportButton.displayName = 'ReportButton';
