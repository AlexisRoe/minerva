export type ServiceStatus = 'up' | 'down';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  services: {
    databaseRead: ServiceStatus;
    databaseWrite: ServiceStatus;
    valkey: ServiceStatus;
    s3: ServiceStatus;
  };
}

export interface HelloEventRequest {
  message: string;
}

export interface HelloEventResponse {
  eventId: string;
}

export interface HelloEventPayload {
  type: 'hello';
  message: string;
  source: string;
  occurredAt: string;
}

export interface CamoSignRequest {
  url: string;
}

export interface CamoSignResponse {
  proxyUrl: string;
}
