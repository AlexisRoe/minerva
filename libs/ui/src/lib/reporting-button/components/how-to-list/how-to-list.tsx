import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';

export interface HowToListProps extends ComponentProps<'div'> {
  /** Small-caps label above the list, e.g. "What to do now". Omitted if not given. */
  heading?: string;
  /** Action items, rendered in order with a dash bullet. */
  items: string[];
}

/** Left-aligned, dash-bulleted list of action items, with an optional small-caps label above it. */
export function HowToList({ heading, items, className, ...props }: HowToListProps) {
  return (
    <div data-slot="how-to-list" className={cn('flex flex-col gap-3 text-left', className)} {...props}>
      {heading && (
        <h2
          data-slot="how-to-list-heading"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {heading}
        </h2>
      )}
      <ul data-slot="how-to-list-items" className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 text-sm/relaxed">
            <span aria-hidden="true">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
