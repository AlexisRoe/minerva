import type { ComponentProps } from 'react';
import minervaLogo from '../../assets/minerva-logo.svg';
import { cn } from '../utils/cn';

export interface BrandProps extends ComponentProps<'div'> {
  /** Title shown next to the logo. Defaults to "Minerva". */
  title?: string;
}

/** The Minerva logo mark paired with its uppercase title. */
export function Brand({ title = 'Minerva', className, ...props }: BrandProps) {
  return (
    <div data-slot="brand" className={cn('flex items-center gap-2', className)} {...props}>
      <img src={minervaLogo} alt="" className="h-8 w-8" />
      <span className="text-lg font-bold uppercase">{title}</span>
    </div>
  );
}
