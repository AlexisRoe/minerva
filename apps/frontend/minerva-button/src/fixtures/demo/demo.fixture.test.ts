import { describe, expect, it } from 'vitest';

import { DEMO_MIME_CONTENT } from './mime.fixture';
import { demoAuthorization, demoReportingResponses, demoSettings } from './minerva.fixture';
import { demoUser } from './office.fixture';

describe('the demo fixtures', () => {
  it('describes the same email in the MIME as on screen', () => {
    // A walkthrough where the subject in the pane did not match the subject in
    // the attached .eml would undermine the one thing being demonstrated.
    expect(DEMO_MIME_CONTENT).toContain('Action required: your mailbox will be suspended');
    expect(DEMO_MIME_CONTENT).toContain('it-support@contoso-billing.example');
  });

  it('signs in as the user Outlook reports', () => {
    expect(demoAuthorization.userProfile).toEqual({ name: demoUser.name, email: demoUser.email });
  });

  it('turns every optional feature on, so no branch goes unrendered', () => {
    expect(demoSettings.features).toEqual({
      enableEmailDetails: true,
      enableSpamReporting: true,
    });
    expect(demoSettings.contact.enable).toBe(true);
    expect(demoSettings.userFeedback.enableReportingReasons).toBe(true);
    expect(demoSettings.userFeedback.reportingReasons.length).toBeGreaterThan(1);
  });

  it('offers two reporting methods that differ in whether they attach', () => {
    // A partial fan-out is the interesting case for the confirmation screen, and
    // it needs two methods that visibly differ.
    expect(demoSettings.reportingMethods.map((method) => method.attachOriginalEmail)).toEqual([true, false]);
  });

  it('covers every confirmation variant with a distinct report id', () => {
    const responses = Object.values(demoReportingResponses);

    expect(responses.map((response) => response.identifiedAs)).toEqual(['system', 'simulation', 'unknown']);
    expect(new Set(responses.map((response) => response.reportId)).size).toBe(responses.length);
  });

  it('marks the unrecognised outcome as unidentified', () => {
    expect(demoReportingResponses.unknown.isIdentified).toBe(false);
    expect(demoReportingResponses.system.isIdentified).toBe(true);
  });
});
