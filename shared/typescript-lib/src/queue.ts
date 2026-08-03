/**
 * The job contract exchanged between the api and the queue-coordinator.
 *
 * Both services depend on this module so a change to the payload shape is a
 * compile error on either side rather than a runtime surprise.
 */

import { isObjectLike } from './validators/validator.utils';

export const EMAIL_JOB_KINDS = ['parse', 'screenshot'] as const;

export type EmailJobKind = (typeof EMAIL_JOB_KINDS)[number];

export interface EmailJob {
  /** Stable id, used for de-duplication across retries. */
  readonly id: string;
  readonly kind: EmailJobKind;
  /** Message id of the email this job refers to. */
  readonly messageId: string;
  /** ISO-8601 timestamp of when the job was enqueued. */
  readonly enqueuedAt: string;
}

export function isEmailJobKind(value: unknown): value is EmailJobKind {
  return typeof value === 'string' && (EMAIL_JOB_KINDS as readonly string[]).includes(value);
}

export function isEmailJob(value: unknown): value is EmailJob {
  if (!isObjectLike(value)) {
    return false;
  }

  const job = value as Partial<Record<keyof EmailJob, unknown>>;
  return (
    typeof job.id === 'string' &&
    typeof job.messageId === 'string' &&
    typeof job.enqueuedAt === 'string' &&
    isEmailJobKind(job.kind)
  );
}
