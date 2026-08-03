import type { EmailJob, EmailJobKind } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';

export interface HealthReport {
  status: 'ok';
  service: 'queue-coordinator';
}

/**
 * Holds the jobs handed over by the api until a worker claims them.
 *
 * In-memory for now — the real broker lands with the worker services.
 */
@Injectable()
export class AppService {
  private readonly pending: EmailJob[] = [];

  health(): HealthReport {
    return { status: 'ok', service: 'queue-coordinator' };
  }

  /** Accepts a job, ignoring a repeat of one already queued. */
  accept(job: EmailJob): { accepted: boolean; depth: number } {
    const known = this.pending.some((queued) => queued.id === job.id);
    if (!known) {
      this.pending.push(job);
    }

    return { accepted: !known, depth: this.pending.length };
  }

  /** Removes and returns the oldest job of the given kind, if there is one. */
  claim(kind: EmailJobKind): EmailJob | null {
    const index = this.pending.findIndex((job) => job.kind === kind);
    if (index === -1) {
      return null;
    }

    const [job] = this.pending.splice(index, 1);
    return job ?? null;
  }

  depth(): number {
    return this.pending.length;
  }
}
