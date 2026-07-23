import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export interface InformationSectionProps extends ComponentProps<'div'> {
  /** Small-caps section heading, e.g. "User". */
  title: string;
  /** Sub-information rows, typically one or more `InformationItem`s. */
  children: ReactNode;
}

/** Small-caps heading and divider, followed by a stack of sub-information rows (e.g. `InformationItem`s). */
export function InformationSection({ title, children, className, ...props }: InformationSectionProps) {
  return (
    <div data-slot="information-section" className={cn('flex flex-col gap-4', className)} {...props}>
      <h2
        data-slot="information-section-title"
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {title}
      </h2>
      <div data-slot="information-section-content" className="flex flex-col gap-4">
        {children}
      </div>
      <hr data-slot="information-section-divider" className="border-border" />
    </div>
  );
}
