import type { MinervaButtonSettings } from '@minerva/typescript-lib';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { fillSession } from '@/fixtures/session.fixture';
import { resetStores } from '@/fixtures/stores.fixture';
import type { UseSettings } from '@/stores/session/hooks/use-settings.hook';
import { useSettings } from './use-settings.hook';

/** Loads a configuration and renders the hook against it. */
function withSettings(settings?: MinervaButtonSettings): { current: UseSettings } {
  if (settings !== undefined) {
    fillSession({ settings });
  }

  return renderHook(() => useSettings()).result;
}

describe('useSettings', () => {
  afterEach(resetStores);

  it('answers every flag false before the settings land', () => {
    const result = withSettings();

    expect(result.current).toMatchObject({
      settings: null,
      isEnabled: false,
      canShowDetails: false,
      canReportSpam: false,
      hasContact: false,
      contact: null,
      isReasonMandatory: false,
      hasFreetextField: false,
      reportingMethods: [],
    });
    expect(result.current.reasonsFor('suspicious')).toEqual([]);
  });

  it('collapses the nesting the views would otherwise repeat', () => {
    const result = withSettings(demoSettings);

    expect(result.current).toMatchObject({
      isEnabled: true,
      canShowDetails: true,
      canReportSpam: true,
      hasContact: true,
      isReasonMandatory: true,
      hasFreetextField: true,
    });
    expect(result.current.reportingMethods).toEqual(demoSettings.reportingMethods);
  });

  it('hides the spam button where the tenant switched it off', () => {
    const result = withSettings({
      ...demoSettings,
      features: { ...demoSettings.features, enableSpamReporting: false },
    });

    expect(result.current.canReportSpam).toBe(false);
    expect(result.current.canShowDetails).toBe(true);
  });

  it('treats a disabled contact block as no contact at all', () => {
    const result = withSettings({
      ...demoSettings,
      contact: { ...demoSettings.contact, enable: false },
    });

    expect(result.current.hasContact).toBe(false);
    expect(result.current.contact).toBeNull();
  });

  it('offers the tenant reasons for either variant', () => {
    const result = withSettings(demoSettings);

    expect(result.current.reasonsFor('suspicious')).toEqual(demoSettings.userFeedback.reportingReasons);
    expect(result.current.reasonsFor('spam')).toEqual(demoSettings.userFeedback.reportingReasons);
  });

  it('offers no reasons when reasons are switched off', () => {
    const result = withSettings({
      ...demoSettings,
      userFeedback: { ...demoSettings.userFeedback, enableReportingReasons: false },
    });

    expect(result.current.reasonsFor('suspicious')).toEqual([]);
  });

  it('offers no reasons when feedback as a whole is switched off', () => {
    const result = withSettings({
      ...demoSettings,
      userFeedback: { ...demoSettings.userFeedback, enabled: false },
    });

    expect(result.current.reasonsFor('spam')).toEqual([]);
  });
});
