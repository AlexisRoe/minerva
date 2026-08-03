/**
 * The task pane's adapter for Minerva's own API.
 *
 * The pane reads from Microsoft and writes here: this is the only folder that
 * knows the API's paths and payload shapes. The payload types are local for now
 * and move to `@minerva/typescript-lib` once the endpoint exists on the API
 * side, so a contract change breaks both builds rather than production.
 *
 * @see {@link ../../../../backend/api} -- the service behind these calls
 */

export type { SubmitWorkItemState } from './hooks/use-submit-work-item.hook';
export { useSubmitWorkItem } from './hooks/use-submit-work-item.hook';
export type { WorkItemDraft, WorkItemReceipt } from './minerva.types';
export { MINERVA_API_PATH } from './minerva.types';
export { submitWorkItem } from './utils/submit-work-item.util';
