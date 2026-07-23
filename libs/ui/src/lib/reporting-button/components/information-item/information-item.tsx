import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';

export interface InformationItemProps extends ComponentProps<'div'> {
  /** Small label above the value, e.g. "Name". */
  label: string;
  /** The value to display, e.g. "Jamie Keller". */
  value: string;
}

/** A single labeled value row, e.g. "Name" above "Jamie Keller", used within an `InformationSection`. */
export function InformationItem({ label, value, className, ...props }: InformationItemProps) {
  return (
    <div data-slot="information-item" className={cn('flex flex-col gap-1', className)} {...props}>
      <span data-slot="information-item-label" className="text-sm text-muted-foreground">
        {label}
      </span>
      <span data-slot="information-item-value" className="text-sm font-medium break-all text-foreground">
        {value}
      </span>
    </div>
  );
}
