import type { DrawerRootActions, DrawerRootChangeEventDetails } from '@base-ui/react/drawer';
import { IconSend2 } from '@tabler/icons-react';
import { type ComponentProps, type ReactElement, useRef, useState } from 'react';
import { Button } from '../../../base/components/button/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '../../../base/components/drawer/drawer';
import { Textarea } from '../../../base/components/textarea/textarea';
import { cn } from '../../../utils/cn';
import type { variantIcons } from '../mail-classification-card/mail-classification-card';
import { type ReportReason, ReportReasonList } from '../report-reason-list/report-reason-list';
import { ReportingHeader } from '../reporting-header/reporting-header';

export interface ReportingFeedbackDrawerValues {
  /** Ids of the reasons the user ticked, in the order given in `reasons`. */
  reasonIds: string[];
  /** Free-text details the user typed, trimmed. `''` if left blank. */
  details: string;
}

export interface ReportingFeedbackDrawerProps
  extends Omit<ComponentProps<typeof Drawer>, 'swipeDirection' | 'children' | 'actionsRef'> {
  /** Which kind of report this is; drives the header icon via `ReportingHeader`. */
  type: keyof typeof variantIcons;
  /** Heading shown above the reason list, e.g. "What makes this suspicious?". */
  title: string;
  /** Reasons the user can tick, in display order. */
  reasons: ReportReason[];
  /** Placeholder for the optional free-text box, e.g. "Add any extra details (optional)". */
  textareaPlaceholder?: string;
  /** Label of the full-width primary button, e.g. "Report email". */
  primaryButtonText: string;
  /**
   * Called once built-in and custom validation both pass, with the selected reason ids
   * and trimmed free-text details. May return a promise: while it is pending the primary
   * button is disabled. The drawer closes automatically only after it resolves; if it
   * throws or rejects, the drawer stays open.
   */
  onPrimaryAction: (values: ReportingFeedbackDrawerValues) => void | Promise<void>;
  /** Label of the outline button, which always just closes the drawer, e.g. "Cancel". */
  outlineButtonText: string;
  /**
   * When `true`, at least one reason must be ticked before submit. The free-text box is
   * always optional regardless of this setting.
   * @default false
   */
  requireReason?: boolean;
  /**
   * Extra validation on top of the built-in "at least one reason" check. Runs only after
   * that built-in check passes. Return an error message to block submit, or `undefined`
   * to allow it.
   */
  validate?: (values: ReportingFeedbackDrawerValues) => string | undefined;
  /**
   * Overrides the built-in ghost, icon-only `IconSend2` open button. Passed straight
   * through to `DrawerTrigger`'s `render`.
   */
  trigger?: ReactElement;
  /** Merged onto the drawer's content surface. */
  className?: string;
}

const defaultTrigger = (
  <Button variant="ghost" size="icon" aria-label="Report email">
    <IconSend2 />
  </Button>
);

/** Full-height right-side drawer collecting a reporting reason (and optional details) before calling its primary action. */
export function ReportingFeedbackDrawer({
  type,
  title,
  reasons,
  textareaPlaceholder,
  primaryButtonText,
  onPrimaryAction,
  outlineButtonText,
  requireReason = false,
  validate,
  trigger,
  className,
  onOpenChange: onOpenChangeProp,
  ...props
}: ReportingFeedbackDrawerProps) {
  const actionsRef = useRef<DrawerRootActions>(null);
  const [reasonIds, setReasonIds] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(open: boolean, eventDetails: DrawerRootChangeEventDetails) {
    if (open) {
      setReasonIds([]);
      setDetails('');
      setError(undefined);
    }
    onOpenChangeProp?.(open, eventDetails);
  }

  async function handlePrimaryAction() {
    const values: ReportingFeedbackDrawerValues = { reasonIds, details: details.trim() };
    const validationError =
      (requireReason && values.reasonIds.length === 0 ? 'Select at least one reason to continue.' : undefined) ??
      validate?.(values);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      await onPrimaryAction(values);
      actionsRef.current?.close();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer swipeDirection="right" actionsRef={actionsRef} onOpenChange={handleOpenChange} {...props}>
      <DrawerTrigger render={trigger ?? defaultTrigger} />
      <DrawerContent data-slot="reporting-feedback-drawer" className={cn('gap-4', className)}>
        <DrawerHeader>
          <ReportingHeader variant={type} title={title} />
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-2">
          <ReportReasonList reasons={reasons} value={reasonIds} onValueChange={setReasonIds} />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Textarea
            placeholder={textareaPlaceholder}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </div>

        <DrawerFooter>
          <Button className="w-full" onClick={handlePrimaryAction} disabled={submitting}>
            {primaryButtonText}
          </Button>
          <DrawerClose
            render={
              <Button variant="outline" className="w-full">
                {outlineButtonText}
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
