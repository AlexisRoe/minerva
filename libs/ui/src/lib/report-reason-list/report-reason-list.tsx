import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import type { ComponentProps } from 'react';
import { Checkbox } from '../checkbox/checkbox';
import { Label } from '../label/label';
import { cn } from '../utils/cn';

export interface ReportReason {
  id: string;
  label: string;
}

export interface ReportReasonListProps extends ComponentProps<typeof CheckboxGroup> {
  /** The reasons to render as checkboxes, in order. */
  reasons: ReportReason[];
}

/** A list of report reasons rendered as checkboxes sharing one selected-ids array (`value`/`defaultValue`/`onValueChange`). */
export function ReportReasonList({ reasons, className, ...props }: ReportReasonListProps) {
  return (
    <CheckboxGroup data-slot="report-reason-list" className={cn('flex flex-col', className)} {...props}>
      {reasons.map((reason) => (
        <div key={reason.id} className="flex items-start gap-3 py-2">
          <Checkbox id={reason.id} value={reason.id} className="mt-0.5" />
          <Label htmlFor={reason.id} className="font-normal">
            {reason.label}
          </Label>
        </div>
      ))}
    </CheckboxGroup>
  );
}
