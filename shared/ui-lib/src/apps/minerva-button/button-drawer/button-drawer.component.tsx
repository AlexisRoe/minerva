import {
  Drawer,
  type DrawerBodyProps,
  type DrawerHeaderProps,
  type DrawerProps,
  type DrawerRootProps,
  type ModalBaseCloseButtonProps,
  type ModalBaseOverlayProps,
  Stack,
  type StackProps,
  useProps,
} from '@mantine/core';
import { Children, type ReactNode } from 'react';

/**
 * As wide as the room it is given, less the gap it floats by on either side. The
 * offset is read off the drawer rather than repeated here, so the panel follows
 * whatever the theme sets instead of pinning a number of its own.
 */
const panelSize = 'calc(100% - var(--drawer-offset) * 2)';

/**
 * The panel is a column: header, then the body with everything that is left, then
 * the footer. Taking the scroll off the panel is what pins the footer — Mantine
 * scrolls the whole panel by default, which would carry the footer with it.
 *
 * It goes on through `styles` rather than as a plain `style`, which `Drawer.Content`
 * would put on the box around the panel as well as on the panel itself.
 */
const contentStyles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
} as const;

/**
 * A drawer lays the box around its panel out with `position: fixed`, which is what
 * makes it cover the page. Switching it to `absolute` resolves it against the
 * container instead, as long as that container is positioned. The overlay is turned
 * the same way, but takes it as a prop of its own.
 */
const scopedContentStyles = {
  ...contentStyles,
  inner: { position: 'absolute' },
} as const;

/** Padding of the header and the body, which the footer matches. */
const panelPadding = 'var(--mb-padding, var(--mantine-spacing-md))';

/**
 * The fill and the rule the theme gives every band in the interface, the report
 * page's included. The header is dressed in them by the theme; the footer is ours
 * to draw, so it picks the same two up here.
 */
const bandBackground = 'var(--minerva-band-bg)';
const bandBorder = 'var(--minerva-band-border)';

/**
 * The scroll lives on the body, so only the content moves under the header and the
 * footer. Neither has a style prop of its own — everything else the body needs is
 * one.
 */
const bodyStyle = {
  minHeight: 0,
  overflowY: 'auto',
} as const;

/** The rule over the footer, the twin of the one the theme draws under the header. */
const footerStyle = { borderTop: bandBorder } as const;

export type ButtonDrawerFooterProps = StackProps;

/**
 * @description The block at the foot of the panel, which stays put while the
 * content scrolls. It draws nothing of its own: given nothing to put in it, there
 * is no footer at all rather than an empty band.
 *
 * Every child takes the full width, one under the next. The pane is narrow enough
 * that two buttons side by side would be down to a few characters each, and a
 * single button across the row is what makes it read as the way on from here rather
 * than something left over at the end of the panel.
 */
function ButtonDrawerFooter({ children, ...rest }: ButtonDrawerFooterProps) {
  const buttons = Children.toArray(children);

  if (buttons.length === 0) return null;

  return (
    <Stack
      component="footer"
      gap="sm"
      p={panelPadding}
      flex="0 0 auto"
      bg={bandBackground}
      style={footerStyle}
      {...rest}
    >
      {buttons}
    </Stack>
  );
}

ButtonDrawerFooter.displayName = 'ButtonDrawer.Footer';

export interface ButtonDrawerHeaderProps extends DrawerHeaderProps {
  /** Whether the way out belongs in the header. It does when nothing else carries one. */
  withCloseButton?: boolean;
  /** Props passed to that close button. */
  closeButtonProps?: ModalBaseCloseButtonProps;
}

/**
 * @description The band at the head of the panel: the title, and the close button
 * where the header is the one carrying it. With neither to put in it the header is
 * left out, and the content starts at the top of the panel.
 */
function ButtonDrawerHeader({ children, withCloseButton = false, closeButtonProps, ...rest }: ButtonDrawerHeaderProps) {
  if (!children && !withCloseButton) return null;

  return (
    <Drawer.Header {...rest}>
      <Drawer.Title>{children}</Drawer.Title>
      {withCloseButton ? <Drawer.CloseButton aria-label="Close" {...closeButtonProps} /> : null}
    </Drawer.Header>
  );
}

ButtonDrawerHeader.displayName = 'ButtonDrawer.Header';

export type ButtonDrawerBodyProps = DrawerBodyProps;

/**
 * @description Everything between the two bands, and the only part of the panel
 * that scrolls.
 *
 * Mantine drops the body's top padding as soon as the panel holds anything else,
 * on the reckoning that a header above has already set the content off. It has
 * it back here: the content stands clear of whatever is over it, header or not,
 * and the padding around it is the same on all four sides. Pass `pt` to say
 * otherwise.
 */
function ButtonDrawerBody({ children, ...rest }: ButtonDrawerBodyProps) {
  return (
    <Drawer.Body flex="1 1 auto" pt={panelPadding} style={bodyStyle} {...rest}>
      {children}
    </Drawer.Body>
  );
}

ButtonDrawerBody.displayName = 'ButtonDrawer.Body';

const defaultProps = { withOverlay: true } as const;

export interface ButtonDrawerRootProps
  extends Omit<DrawerRootProps, 'position' | 'size' | 'styles' | 'portalProps' | 'lockScroll'> {
  /** Whether the page behind the panel is covered. */
  withOverlay?: boolean;
  /** Props passed to that overlay, for its opacity, its colour and the rest. */
  overlayProps?: ModalBaseOverlayProps;
  /**
   * Element the drawer is rendered into instead of `document.body`. It then covers
   * that element rather than the page, so it needs to be a positioned ancestor —
   * give it `position: relative` and a height.
   */
  container?: HTMLElement | null;
}

/**
 * @description The panel itself, and the parts of the drawer nobody composes: the
 * side it comes in from, the width it takes, the overlay, and where it is rendered.
 * Its children are the panel's own bands, in the order they are drawn.
 */
function ButtonDrawerRoot(props: ButtonDrawerRootProps) {
  const { container, withOverlay, overlayProps, children, ...rest } = useProps('Drawer', defaultProps, props);

  return (
    <Drawer.Root
      position="right"
      size={panelSize}
      portalProps={container ? { target: container } : undefined}
      lockScroll={!container}
      {...rest}
    >
      {withOverlay ? <Drawer.Overlay pos={container ? 'absolute' : undefined} {...overlayProps} /> : null}
      <Drawer.Content styles={container ? scopedContentStyles : contentStyles}>{children}</Drawer.Content>
    </Drawer.Root>
  );
}

ButtonDrawerRoot.displayName = 'ButtonDrawer.Root';

export interface ButtonDrawerProps
  extends Omit<DrawerProps, 'position' | 'size' | 'withCloseButton' | 'styles' | 'portalProps' | 'lockScroll'> {
  /**
   * The block at the foot of the panel, which stays put while the content
   * scrolls. Buttons go here — none of its own, and each takes the full width,
   * one under the next. Give it nothing and the header takes a close button
   * instead, so the drawer always has a way out.
   */
  footer?: ReactNode;
  /**
   * Element the drawer is rendered into instead of `document.body`. It then
   * covers that element rather than the page, so it needs to be a positioned
   * ancestor — give it `position: relative` and a height.
   */
  container?: HTMLElement | null;
}

/**
 * @description The drawer of the report pane: it comes in from the right and takes
 * the whole pane, less the offset it floats by, so there is no half-open state to
 * design for. Below the header the panel splits into content that scrolls and a
 * footer that does not, for the buttons that end the job the drawer was opened
 * for — each across the full width, one under the next. The header and the footer
 * are set off from the content by the fill and the rule the theme gives them.
 *
 * The way out is in one place, never two: a drawer with a footer has no cross in
 * its header, and a drawer without one gets the cross back. Nothing is put in the
 * footer, so a drawer given a footer of its own owns that job.
 *
 * Everything else a Mantine `Drawer` takes still applies, `title`, `radius`,
 * `offset`, `withOverlay` and the rest — only the side it opens from, its size
 * and where the close button lands are fixed.
 *
 * Where a panel wants something this does not cover — a header of its own making,
 * or a second block under the body — the parts it is built from are on it, and can
 * be laid out by hand: `ButtonDrawer.Root`, `.Header`, `.Body` and `.Footer`. They
 * make the same panel; what the props do for you then falls to the caller, the
 * choice between a close button and a footer included.
 *
 * @example
 * ```tsx
 * <ButtonDrawer
 *   opened={opened}
 *   onClose={close}
 *   title="Report details"
 *   footer={
 *     <Button variant="outline" onClick={close}>
 *       Close
 *     </Button>
 *   }
 * >
 *   …
 * </ButtonDrawer>
 * ```
 *
 * @example
 * ```tsx
 * <ButtonDrawer.Root opened={opened} onClose={close}>
 *   <ButtonDrawer.Header withCloseButton>Report details</ButtonDrawer.Header>
 *   <ButtonDrawer.Body>…</ButtonDrawer.Body>
 * </ButtonDrawer.Root>
 * ```
 */
export function ButtonDrawer(props: ButtonDrawerProps) {
  const { title, footer, closeButtonProps, children, ...rest } = props;

  const buttons = Children.toArray(footer);
  const withCloseButton = buttons.length === 0;

  return (
    <ButtonDrawerRoot {...rest}>
      <ButtonDrawerHeader withCloseButton={withCloseButton} closeButtonProps={closeButtonProps}>
        {title}
      </ButtonDrawerHeader>
      <ButtonDrawerBody>{children}</ButtonDrawerBody>
      <ButtonDrawerFooter>{footer}</ButtonDrawerFooter>
    </ButtonDrawerRoot>
  );
}

ButtonDrawer.displayName = 'ButtonDrawer';
ButtonDrawer.Root = ButtonDrawerRoot;
ButtonDrawer.Header = ButtonDrawerHeader;
ButtonDrawer.Body = ButtonDrawerBody;
ButtonDrawer.Footer = ButtonDrawerFooter;
