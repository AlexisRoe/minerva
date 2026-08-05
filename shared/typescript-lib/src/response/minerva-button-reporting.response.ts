export type EmailType = 'system' | 'simulation' | 'unknown';

export interface ReportingResponse {
  /** Unique identifier as uuid v4 */
  reportId: string;
  /** Is it an email known to the system */
  isIdentified: boolean;
  /** Describes what kind if email was reported and if it could be identified */
  identifiedAs: EmailType;
}
