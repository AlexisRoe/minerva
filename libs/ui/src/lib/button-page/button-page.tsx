import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { Brand } from '../brand/brand';
import { Card } from '../card/card';
import { cn } from '../utils/cn';

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
 * (fills the remaining space with a white, rounded-corner content card,
 * optionally centered on both axes).
 *
 * `fullscreen` is set on the root `ButtonPage` and makes `ButtonPage.Content`
 * always centered and shifted 45px towards the top.
 */
function ButtonPageRoot({ children, fullscreen = false, className, ...props }: ButtonPageProps) {
  return (
    <ButtonPageContext.Provider value={{ fullscreen }}>
      <div data-slot="page" className={cn('fixed inset-0 flex flex-col overflow-hidden', className)} {...props}>
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
      className={cn(
        'sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 bg-neutral-50 px-[18px] pt-[16px] pb-[4px]',
        className,
      )}
      {...props}
    >
      <Brand title={title} data-slot="page-header-left" />
      <div data-slot="page-header-right" className="flex items-center">
        {right}
      </div>
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

  return (
    <div
      data-slot="page-content-background"
      className="flex-1 overflow-hidden bg-neutral-50 px-[16px] pt-[8px] pb-[16px]"
    >
      <Card
        data-slot="page-content"
        data-testid="page-content"
        className={cn(
          'h-full w-full overflow-auto p-[5px]',
          isCentered && 'flex items-center justify-center',
          className,
        )}
        {...props}
      >
        <div className={cn(fullscreen && '-translate-y-[45px]')}>{children}</div>
      </Card>
    </div>
  );
}

export const ButtonPage = Object.assign(ButtonPageRoot, {
  Header: ButtonPageHeader,
  Content: ButtonPageContent,
});
