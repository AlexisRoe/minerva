export const APP_NAME = 'Minerva';

/** Valkey stream all domain events are published to. */
export const EVENT_STREAM = 'minerva:events';

/** Dead-letter stream for events that exhausted their retries. */
export const EVENT_DLQ_STREAM = 'minerva:events:dlq';

export const API_ROUTES = {
  health: '/health',
  helloEvent: '/events/hello',
  camoSign: '/images/sign',
} as const;
