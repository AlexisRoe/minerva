/**
 * Multipart body the button uploads when a user reports an email.
 *
 * @example
 * ```ts
 * const body: ReportingFormData = {
 *   file: mimeBlob,
 *   reportingReasons: ['9f1c2b70-0f6d-4a3e-9d21-6c8f5b2a1e04'],
 *   feedbackMessage: '',
 *   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
 *   userLanguage: 'en-US',
 *   reportedAs: 'suspicious',
 *   deliveredAt: '2026-08-03T09:15:00.000Z',
 *   exchangeId: 'AAMkAD==',
 * };
 * ```
 */
export interface ReportingFormData {
  /** Raw mime email to be uploaded (contentType message/rfc822) */
  file: Blob;
  /** Array of unique identifier of reporting reasons which user selected */
  reportingReasons: string[];
  /** User feedback freetext (empty string if nothing provided) */
  feedbackMessage: string;
  /** User timezone */
  timeZone: string;
  /**
   * BCP-47 language tag as reported by Office.js (e.x. "en-US") -- the full tag
   * including the region, not the internal `Languages` enum. Deliberately
   * different from `MinervaSettingsRequest.userLanguage`, which is `Languages`
   * because it selects a translation catalogue rather than a template.
   */
  userLanguage: string;
  /** reportType */
  reportedAs: 'suspicious' | 'spam';
  /** ISO Timestamp when the email was delivered to user */
  deliveredAt: string;
  /** Exchange email id to reference the email on server */
  exchangeId: string;
}
