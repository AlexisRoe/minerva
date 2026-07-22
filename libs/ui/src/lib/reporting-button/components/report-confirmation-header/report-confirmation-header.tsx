import { IconMailbox } from '@tabler/icons-react';
import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';

export interface ReportConfirmationHeaderProps extends ComponentProps<'div'> {
  /** Heading text, e.g. "This was a simulation". */
  title: string;
  /** Supporting copy shown below the title. */
  description: string;
  /** Optional bold status line shown below a divider, e.g. "This email has been moved to your Spam folder." */
  statusMessage?: string;
}

/** Centered mailbox icon, title, and description, with an optional divider + bold status line below it. */
export function ReportConfirmationHeader({
  title,
  description,
  statusMessage,
  className,
  ...props
}: ReportConfirmationHeaderProps) {
  return (
    <div
      data-slot="report-confirmation-header"
      className={cn('flex flex-col items-center gap-6 text-center', className)}
      {...props}
    >
      <IconMailbox className="size-16 shrink-0" stroke={1.5} />
      <div className="flex flex-col gap-2">
        <h1 data-slot="report-confirmation-header-title" className="font-heading text-2xl font-bold text-foreground">
          {title}
        </h1>
        <p data-slot="report-confirmation-header-description" className="text-sm/relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {statusMessage && (
        <div className="flex w-full flex-col items-center gap-6">
          <hr data-slot="report-confirmation-header-divider" className="w-full border-border" />
          <p data-slot="report-confirmation-header-status" className="font-heading text-lg font-bold text-foreground">
            {statusMessage}
          </p>
        </div>
      )}
    </div>
  );
}
