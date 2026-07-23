import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { variantIcons } from '../mail-classification-card/mail-classification-card';

export interface ReportingHeaderProps extends ComponentProps<'div'> {
  /** Which classification icon to show. */
  variant: keyof typeof variantIcons;
  /** Heading text, e.g. "What makes this suspicious?". */
  title: string;
}

/** Small icon + heading used to introduce a report-reason question, e.g. above a `ReportReasonList`. */
export function ReportingHeader({ variant, title, className, ...props }: ReportingHeaderProps) {
  const Icon = variantIcons[variant];

  return (
    <div data-slot="reporting-header" className={cn('flex items-center gap-2', className)} {...props}>
      <Icon className="size-5 shrink-0" stroke={1.75} />
      <h2 data-slot="reporting-header-title" className="font-heading text-lg font-bold text-foreground">
        {title}
      </h2>
    </div>
  );
}
