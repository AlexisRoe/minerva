import type { AuthorizationResult, EmailType, MinervaButtonSettings, ReportingResponse } from '@minerva/typescript-lib';

import { demoUser } from './office.fixture';

/** A signed-in session, as the backend would answer after validating a token. */
export const demoAuthorization: AuthorizationResult = {
  isAuthorized: true,
  userProfile: { name: demoUser.name, email: demoUser.email },
  sessionId: '5c1f8a94-2d63-4f07-b8e1-73a0c9d45e26',
};

/**
 * A tenant configuration that turns every switch on.
 *
 * Deliberately maximal. A fixture that left features off would render a demo
 * missing exactly the parts hardest to build -- the details drawer, the spam
 * button, the reasons list, the contact block -- so every optional branch is
 * populated here and a case that needs one *off* overrides it:
 *
 * @example
 * ```ts
 * const settings = { ...demoSettings, contact: { enable: false } };
 * ```
 */
export const demoSettings: MinervaButtonSettings = {
  enabled: true,
  features: {
    enableEmailDetails: true,
    enableSpamReporting: true,
  },
  reportingMethods: [
    {
      subjectPrefix: 'SUSPICIOUS| ',
      address: 'soc@contoso.example',
      attachOriginalEmail: true,
    },
    {
      // The second method deliberately does not attach: a partial fan-out is the
      // interesting case for the confirmation screen, and it needs two methods
      // that visibly differ.
      subjectPrefix: '3| ',
      address: 'abuse-reports@contoso-mssp.example',
      attachOriginalEmail: false,
    },
  ],
  userFeedback: {
    enabled: true,
    enableReportingReasons: true,
    isReportingReasonMandatory: true,
    enableFreetextField: true,
    reportingReasons: [
      {
        label: 'Unexpected request for my password',
        defaultLabel: 'Unexpected request for my password',
        value: '0b8e5a31-4c72-4d95-9a60-1e37f2c8b4d0',
      },
      {
        label: 'Sender address looks wrong',
        defaultLabel: 'Sender address looks wrong',
        value: 'c4a71f68-9b03-4e2a-8d57-6f01a9e3c275',
      },
      {
        label: 'Unexpected attachment or link',
        defaultLabel: 'Unexpected attachment or link',
        value: '7d3e9c02-5a18-4b7f-93c6-8e40d1b5a739',
      },
    ],
  },
  contact: {
    enable: true,
    emailAdress: 'security-team@contoso.example',
    contactPerson: 'Grace Hopper, Security Operations',
    informationUrl: 'https://intranet.contoso.example/security/phishing',
  },
};

/**
 * One report outcome per {@link EmailType}, so every confirmation variant is reachable.
 *
 * The demo cycles these rather than always answering `system`: what the
 * confirmation screen says changes completely between a recognised simulation, a
 * recognised real threat and an email the backend has never seen, and a demo
 * that only ever showed one of the three would hide two thirds of the screen.
 */
export const demoReportingResponses: Readonly<Record<EmailType, ReportingResponse>> = {
  system: {
    reportId: 'a1e6b7c2-38d4-4f09-91ab-5c7e0d2f4836',
    isIdentified: true,
    identifiedAs: 'system',
  },
  simulation: {
    reportId: 'b2f7c8d3-49e5-4a10-82bc-6d8f1e3a5947',
    isIdentified: true,
    identifiedAs: 'simulation',
  },
  unknown: {
    reportId: 'c3a8d9e4-5af6-4b21-93cd-7e902f4b6a58',
    isIdentified: false,
    identifiedAs: 'unknown',
  },
};

/** What a demo report answers with unless a case asks for another outcome. */
export const demoReportingResponse: ReportingResponse = demoReportingResponses.system;
