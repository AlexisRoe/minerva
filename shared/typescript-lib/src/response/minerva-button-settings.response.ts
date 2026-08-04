export interface ReportingFeatures {
  /** Open satelite drawer with email and user details (default: true) */
  enableEmailDetails: boolean;
  /** Allows users to report emails as spam (default: true) */
  enableSpamReporting: boolean;
}

export interface ReportingReasons {
  /** Reporting reason in user language */
  label: string;
  /** Reporting reason in English */
  defaultLabel: string;
  /** Unique identifier as uuid v4 */
  value: string;
}

export interface UserFeedback {
  /** Enable the ability of the user to give feedback in the drawer (default: true) */
  enabled: boolean;
  /** Enable reporting reasons (default true) */
  enableReportingReasons: boolean;
  /** Defines if a user needs to choose at least one reporting reason (default: false) */
  isReportingReasonMandatory: boolean;
  /** Enable user to fill an optional free text field (default: true) */
  enableFreetextField: boolean;
  /** User reporting reasons */
  reportingReasons: ReportingReasons[];
}

export interface ReportingMethod {
  /** Prefix for subjects (e.x. SPAM| or 3|) */
  subjectPrefix: string;
  /** Target email address where the email is send to */
  address: string;
  /** Defines if .eml will be attached to the email */
  attachOriginalEmail: boolean;
}

export interface Contact {
  /** Enable special contact field at the end (default: false) */
  enable: boolean;
  /** Optional email address where user can send requests too */
  emailAdress?: string;
  /** Responsible contact person */
  contactPerson?: string;
  /** Where to find more information, e.x. intranet */
  informationUrl?: string;
}

export interface MinervaButtonSettings {
  /** Enable the reporting button in general */
  enabled: boolean;
  /** some general features */
  features: ReportingFeatures;
  /** Reporting methods */
  reportingMethods: ReportingMethod[];
  /** What the user may add to a report, and which reasons they can pick from */
  userFeedback: UserFeedback;
  /** Configure contact for last screen */
  contact: Contact;
}
