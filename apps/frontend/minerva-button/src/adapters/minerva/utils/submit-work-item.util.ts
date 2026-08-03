import { MINERVA_API_PATH, type WorkItemDraft, type WorkItemReceipt } from '../minerva.types';

/**
 * Hands a message to Minerva to be turned into a work item.
 *
 * The call is a plain `POST` and returns the receipt rather than the finished
 * item: the backend queues the work, so there is nothing to wait for beyond the
 * acknowledgement, and the pane closes on it.
 *
 * @param draft The message to submit.
 * @returns The receipt Minerva answered with.
 * @throws {Error} When the API answers with a non-2xx status.
 *
 * @example
 * ```ts
 * const receipt = await submitWorkItem({ messageId, subject, from, body });
 * ```
 */
export async function submitWorkItem(draft: WorkItemDraft): Promise<WorkItemReceipt> {
  const response = await fetch(`${MINERVA_API_PATH}/work-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error(`Minerva answered ${response.status} for message ${draft.messageId}.`);
  }

  return (await response.json()) as WorkItemReceipt;
}
