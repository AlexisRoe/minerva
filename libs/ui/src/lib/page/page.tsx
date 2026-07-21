import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../utils/cn';

interface PageContextValue {
  fullscreen: boolean;
}

const PageContext = createContext<PageContextValue>({ fullscreen: false });

export interface PageProps extends ComponentProps<'div'> {
  /** When true, Page.Header is not rendered and Page.Content fills the whole viewport. */
  fullscreen?: boolean;
}

/**
 * A fullscreen composite page layout, composed from `Page.Header`
 * (optional, sticky, left / middle / right slots) and `Page.Content`
 * (fills the remaining space, optionally centered on both axes).
 *
 * `fullscreen` is set on the root `Page` and suppresses any `Page.Header`
 * rendered inside it, regardless of what's passed to the header.
 */
function PageRoot({ children, fullscreen = false, className, ...props }: PageProps) {
  return (
    <PageContext.Provider value={{ fullscreen }}>
      <div data-slot="page" className={cn('fixed inset-0 flex flex-col overflow-hidden', className)} {...props}>
        {children}
      </div>
    </PageContext.Provider>
  );
}

export interface PageHeaderProps extends ComponentProps<'header'> {
  /** Left slot of the header (e.g. logo/back button). */
  left?: ReactNode;
  /** Middle slot of the header (e.g. title). Centered between left/right. */
  middle?: ReactNode;
  /** Right slot of the header (e.g. actions). */
  right?: ReactNode;
}

function PageHeader({ left, middle, right, className, ...props }: PageHeaderProps) {
  const { fullscreen } = useContext(PageContext);
  if (fullscreen) return null;

  return (
    <header
      data-slot="page-header"
      className={cn('sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 bg-white p-[25px]', className)}
      {...props}
    >
      <div data-slot="page-header-left" className="flex items-center">
        {left}
      </div>
      <div data-slot="page-header-middle" className="flex flex-1 items-center justify-center">
        {middle}
      </div>
      <div data-slot="page-header-right" className="flex items-center">
        {right}
      </div>
    </header>
  );
}

export interface PageContentProps extends ComponentProps<'div'> {
  /** When true, content is centered both horizontally and vertically. */
  centered?: boolean;
}

function PageContent({ children, centered = false, className, ...props }: PageContentProps) {
  return (
    <div
      data-slot="page-content"
      className={cn('flex-1 overflow-auto p-[25px]', centered && 'flex items-center justify-center', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const Page = Object.assign(PageRoot, {
  Header: PageHeader,
  Content: PageContent,
});
