import type { MinervaButtonSettings } from '@minerva/typescript-lib';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { demoSettings } from '../../../demo';
import { useSettingsStore } from '../settings.store';
import { useSettings } from './use-settings.hook';

/** Loads a configuration and renders the hook against it. */
function withSettings(settings?: MinervaButtonSettings) {
  if (settings !== undefined) {
    useSettingsStore.getState().setSettings(settings);
  }

  return renderHook(() => useSettings()).result;
}

describe('useSettings', () => {
  afterEach(() => {
    useSettingsStore.getState().reset();
  });

  it('answers every flag false before the settings land', () => {
    const result = withSettings();

    // The safe direction: a pane that briefly showed nothing is recoverable, one
    // that briefly offered a disabled button is not.
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

    // The block carries an address and a person even when disabled, so returning
    // the object would have the confirmation screen render it anyway.
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

    // `enabled: false` turns the whole drawer off; the reasons underneath it must
    // not leak out through a flag that is still true.
    expect(result.current.reasonsFor('spam')).toEqual([]);
  });
});
