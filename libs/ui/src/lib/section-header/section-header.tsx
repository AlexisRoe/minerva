import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

export interface SectionHeaderProps extends ComponentProps<'div'> {
  /** Heading text, e.g. "Report this email". */
  title: string;
  /** Supporting copy shown below the title. */
  description: string;
  /** Renders the title and description right-to-left, for RTL locales. Defaults to false. */
  rtl?: boolean;
}

/** Left-aligned title + description block used to introduce a section of content, e.g. the report flow's options list. */
export function SectionHeader({ title, description, rtl = false, className, ...props }: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      dir={rtl ? 'rtl' : 'ltr'}
      className={cn('flex flex-col gap-2 text-left', className)}
      {...props}
    >
      <h1 data-slot="section-header-title" className="font-heading text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p data-slot="section-header-description" className="text-sm/relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
