import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { Brand } from '../../../base/components/brand/brand';
import { cn } from '../../../utils/cn';

interface ButtonPageContextValue {
  fullscreen: boolean;
}

const ButtonPageContext = createContext<ButtonPageContextValue>({ fullscreen: false });

export interface ButtonPageProps extends ComponentProps<'div'> {
  /** When true, ButtonPage.Content is always centered and shifted 45px up for a more pleasing look. */
  fullscreen?: boolean;
}

/**
 * A fullscreen composite page layout, composed from `ButtonPage.Header`
 * (sticky, always visible, with a right slot) and `ButtonPage.Content`
 * (fills the remaining space, optionally centered on both axes).
 *
 * The 16px/32px page padding and the 16px gap between header and content live
 * here on the root — `Header` and `Content` carry no padding of their own.
 *
 * `fullscreen` is set on the root `ButtonPage` and makes `ButtonPage.Content`
 * always centered and shifted 45px towards the top.
 */
function ButtonPageRoot({ children, fullscreen = false, className, ...props }: ButtonPageProps) {
  return (
    <ButtonPageContext.Provider value={{ fullscreen }}>
      <div
        data-slot="page"
        className={cn('fixed inset-0 flex flex-col gap-[16px] overflow-hidden bg-white px-[32px] py-[32px]', className)}
        {...props}
      >
        {children}
      </div>
    </ButtonPageContext.Provider>
  );
}

export interface ButtonPageHeaderProps extends ComponentProps<'header'> {
  /** Title shown next to the logo. Defaults to "Minerva". */
  title?: string;
  /** Right slot of the header (e.g. actions). */
  right?: ReactNode;
}

function ButtonPageHeader({ title = 'Minerva', right, className, ...props }: ButtonPageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn('sticky top-0 z-10 flex shrink-0 flex-col gap-[16px]', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <Brand title={title} data-slot="page-header-left" />
        <div data-slot="page-header-right" className="flex items-center">
          {right}
        </div>
      </div>
      <div data-slot="page-header-divider" className="border-b border-neutral-200" />
    </header>
  );
}

export interface ButtonPageContentProps extends ComponentProps<'div'> {
  /** When true, content is centered both horizontally and vertically. */
  centered?: boolean;
}

function ButtonPageContent({ children, centered = false, className, ...props }: ButtonPageContentProps) {
  const { fullscreen } = useContext(ButtonPageContext);
  const isCentered = centered || fullscreen;

  const contentClassName = cn(
    'min-h-0 flex-1 overflow-auto',
    isCentered && 'flex items-center justify-center',
    className,
  );
  return (
    <div data-slot="page-content" data-testid="page-content" className={contentClassName} {...props}>
      <div className={cn('w-full', !isCentered && 'flex h-full flex-col', fullscreen && '-translate-y-[45px]')}>
        {children}
      </div>
    </div>
  );
}

export const ButtonPage = Object.assign(ButtonPageRoot, {
  Header: ButtonPageHeader,
  Content: ButtonPageContent,
});
