import type { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { HowToList } from '../how-to-list/how-to-list';
import { ReportConfirmationHeader } from '../report-confirmation-header/report-confirmation-header';

export interface ReportConfirmationViewProps extends ComponentProps<'div'> {
  /** Heading text, e.g. "This was a simulation". */
  title: string;
  /** Supporting copy shown below the title. */
  description: string;
  /** Optional bold status line shown below a divider, e.g. "This email has been moved to your Spam folder." */
  statusMessage?: string;
  /** Small-caps label above the how-to list, e.g. "What to do now". */
  howToHeading?: string;
  /** Action items, rendered in order with a dash bullet. */
  howToItems: string[];
}

/** Final screen shown after a report is submitted: a mailbox icon with title/description/status message, followed by a labeled how-to list. */
export function ReportConfirmationView({
  title,
  description,
  statusMessage,
  howToHeading,
  howToItems,
  className,
  ...props
}: ReportConfirmationViewProps) {
  return (
    <div data-slot="report-confirmation-view" className={cn('flex flex-col gap-8 p-6 pt-8', className)} {...props}>
      <ReportConfirmationHeader title={title} description={description} statusMessage={statusMessage} />
      <HowToList heading={howToHeading} items={howToItems} />
    </div>
  );
}
