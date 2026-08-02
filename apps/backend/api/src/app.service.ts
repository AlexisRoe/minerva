import { randomUUID } from 'node:crypto';

import type { EmailJob, EmailJobKind } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';

export interface HealthReport {
  status: 'ok';
  service: 'api';
}

@Injectable()
export class AppService {
  health(): HealthReport {
    return { status: 'ok', service: 'api' };
  }

  /** Builds the job the queue-coordinator will pick up. */
  createJob(kind: EmailJobKind, messageId: string): EmailJob {
    return {
      id: randomUUID(),
      kind,
      messageId,
      enqueuedAt: new Date().toISOString(),
    };
  }
}
