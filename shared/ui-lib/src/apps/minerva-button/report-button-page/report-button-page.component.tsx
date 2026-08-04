import { Box, type BoxProps, type ElementProps, Flex, type FlexProps, Group, type GroupProps } from '@mantine/core';
import { Children } from 'react';

/**
 * The room every band and the content between them are given, on all four sides.
 * A theme step rather than a number, so the page keeps the rhythm of the rest.
 */
const pagePadding = 'xl';

/**
 * The fill and the rule the theme gives every band in the interface. They are the
 * same two the drawer's header and footer are drawn with, picked up here rather
 * than named again, so a page and a panel cannot come out looking unalike.
 */
const bandBackground = 'var(--minerva-band-bg)';
const bandBorder = 'var(--minerva-band-border)';

/** The rule under the header, and its twin over the footer. */
const headerStyle = { borderBottom: bandBorder } as const;
const footerStyle = { borderTop: bandBorder } as const;

/**
 * The content is the only part that moves: it takes whatever height is left and
 * scrolls inside it, which is what keeps the two bands where they were put.
 * Neither is a Mantine prop, so the pair goes on as a style.
 */
const contentStyle = { minHeight: 0, overflowY: 'auto' } as const;

export interface ReportButtonPageProps extends FlexProps, ElementProps<'div'> {}

/**
 * The two bands take what a `Group` takes, DOM attributes included — it carries
 * them already, so naming the element's own would only clash with them.
 */
export interface ReportButtonPageHeaderProps extends GroupProps {}

export interface ReportButtonPageContentProps extends BoxProps, ElementProps<'article'> {}

export interface ReportButtonPageFooterProps extends GroupProps {}

/**
 * @description The page itself: a column of a header, the content that takes the
 * rest of the height, and a footer, in the order they are given. It fills whatever
 * it is mounted into, so that ancestor needs a height of its own.
 */
function ReportButtonPageRoot(props: ReportButtonPageProps): React.ReactElement {
  return <Flex direction="column" h="100%" w="100%" {...props} />;
}

ReportButtonPageRoot.displayName = 'ReportButtonPage';

/**
 * @description The band at the head of the page, set off from the content by the
 * house fill and a rule under it. Its children are set apart across the row — a
 * mark at one end and an action at the other — and a single child simply opens it,
 * which is the header of a page with nothing on the right to balance the mark.
 */
function ReportButtonPageHeader({ style, ...rest }: ReportButtonPageHeaderProps): React.ReactElement {
  return (
    <Group
      component="header"
      justify="space-between"
      align="center"
      wrap="nowrap"
      p={pagePadding}
      bg={bandBackground}
      flex="0 0 auto"
      style={[headerStyle, style]}
      {...rest}
    />
  );
}

ReportButtonPageHeader.displayName = 'ReportButtonPage.Header';

/**
 * @description Everything between the two bands, and the only part of the page
 * that scrolls — which is what pins the header and the footer where they are.
 */
function ReportButtonPageContent({ style, ...rest }: ReportButtonPageContentProps): React.ReactElement {
  return <Box component="article" p={pagePadding} flex="1 1 auto" style={[contentStyle, style]} {...rest} />;
}

ReportButtonPageContent.displayName = 'ReportButtonPage.Content';

/**
 * @description The band at the foot of the page, the twin of the header: the same
 * fill, and the rule over it rather than under. It draws nothing of its own, so a
 * page given nothing to put in it has no footer at all rather than an empty band.
 *
 * Its children are set apart across the row, the way the header's are, so the way
 * on from here takes the end of the row it is read towards.
 */
function ReportButtonPageFooter({ children, style, ...rest }: ReportButtonPageFooterProps): React.ReactElement | null {
  if (Children.toArray(children).length === 0) return null;

  return (
    <Group
      component="footer"
      justify="space-between"
      align="center"
      wrap="nowrap"
      p={pagePadding}
      bg={bandBackground}
      flex="0 0 auto"
      style={[footerStyle, style]}
      {...rest}
    >
      {children}
    </Group>
  );
}

ReportButtonPageFooter.displayName = 'ReportButtonPage.Footer';

/**
 * @description The page frame for the report view: a column of three parts, of
 * which the middle one takes the height that is left. Compose it from its parts —
 * `Header`, `Content` and `Footer` — in the order they should be read; each knows
 * how it sits in the column, so nothing else has to know the layout.
 *
 * The header and the footer are bands, dressed in the fill and the rule the theme
 * gives the drawer's two, so a page and a panel are of a piece. Both stay put while
 * the content between them scrolls. A footer with nothing in it is not drawn, so a
 * page that has no way on from it ends at its content.
 *
 * Every part takes the props of the Mantine component under it — `Group` for the
 * two bands, `Box` for the content — so padding, gaps and the rest are set as
 * props rather than styles.
 *
 * @example
 * ```tsx
 * <ReportButtonPage>
 *   <ReportButtonPage.Header>
 *     <BrandLogo />
 *     <SateliteButton />
 *   </ReportButtonPage.Header>
 *   <ReportButtonPage.Content>…</ReportButtonPage.Content>
 *   <ReportButtonPage.Footer>
 *     <Button>Send report</Button>
 *   </ReportButtonPage.Footer>
 * </ReportButtonPage>
 * ```
 */
export const ReportButtonPage = Object.assign(ReportButtonPageRoot, {
  Header: ReportButtonPageHeader,
  Content: ReportButtonPageContent,
  Footer: ReportButtonPageFooter,
});
