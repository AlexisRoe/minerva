import { useCallback, useState } from 'react';

import type { WorkItemDraft, WorkItemReceipt } from '../minerva.types';
import { submitWorkItem } from '../utils/submit-work-item.util';

/** What {@link useSubmitWorkItem} hands a view. */
export interface SubmitWorkItemState {
  /** Submits a draft. Resolves with the receipt, or `null` when it failed. */
  readonly submit: (draft: WorkItemDraft) => Promise<WorkItemReceipt | null>;
  /** Whether a submission is in flight — the button's disabled state. */
  readonly isSubmitting: boolean;
  /** The receipt of the last successful submission. */
  readonly receipt: WorkItemReceipt | null;
}

/**
 * Drives the one write this pane performs.
 *
 * Unlike the read hooks this fires on a user action, not on mount, so it hands
 * back a callback. `submit` resolves with `null` instead of rejecting: the
 * caller is a click handler, and an unhandled rejection there is a crashed
 * pane. `isSubmitting` is what keeps a double click from queueing twice.
 *
 * @returns The submit callback and the state around it.
 *
 * @see {@link https://react.dev/reference/react/useCallback}
 *
 * @example
 * ```tsx
 * const { submit, isSubmitting } = useSubmitWorkItem();
 * <Button loading={isSubmitting} onClick={() => submit(draft)} />
 * ```
 */
export function useSubmitWorkItem(): SubmitWorkItemState {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<WorkItemReceipt | null>(null);

  const submit = useCallback(async (draft: WorkItemDraft): Promise<WorkItemReceipt | null> => {
    setIsSubmitting(true);

    try {
      const result = await submitWorkItem(draft);
      setReceipt(result);

      return result;
    } catch {
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, receipt };
}
