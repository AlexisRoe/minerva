export interface ReportingFormData {
  /** Raw mime email as buffer send to be uploaded (contentType message/rfc82) */
  file: Buffer;
  /** Array of unique identifier of reporting reasons which user selected */
  reportingReasons: string[];
  /** User feedback freetext (empty string if nothing provided) */
  feedbackMessage: string;
  /** User timezone */
  timeZone: string;
  /** Microsoft user language provided by OfficeJs (e.x. en-US) */
  userLanguage: string;
  /** reportType */
  reportedAs: 'suspicious' | 'spam';
  /** ISO Timestamp when the email was delivered to user */
  deliveredAt: string;
  /** Exchange email id to reference the email on server */
  exchangeId: string;
}
