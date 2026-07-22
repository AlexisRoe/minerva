import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

/** Accessible label for a form control; pair with `htmlFor` and the control's `id`. */
export function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: generic primitive — callers supply htmlFor/children to associate it with a control.
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
