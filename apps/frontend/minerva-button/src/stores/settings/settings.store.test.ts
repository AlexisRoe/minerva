import { afterEach, describe, expect, it } from 'vitest';

import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import { useSettingsStore } from './settings.store';

describe('useSettingsStore', () => {
  afterEach(() => {
    useSettingsStore.getState().reset();
  });

  it('starts empty, before the loader has fetched anything', () => {
    expect(useSettingsStore.getState().settings).toBeNull();
  });

  it('records the fetched configuration', () => {
    useSettingsStore.getState().setSettings(demoSettings);

    expect(useSettingsStore.getState().settings).toEqual(demoSettings);
  });

  it('replaces rather than merges, so a removed method really goes', () => {
    useSettingsStore.getState().setSettings(demoSettings);
    useSettingsStore.getState().setSettings({ ...demoSettings, reportingMethods: [] });

    // A merge would leave a report going to an address the tenant has removed.
    expect(useSettingsStore.getState().settings?.reportingMethods).toEqual([]);
  });

  it('clears the configuration on reset', () => {
    useSettingsStore.getState().setSettings(demoSettings);
    useSettingsStore.getState().reset();

    expect(useSettingsStore.getState().settings).toBeNull();
  });

  it('does not write itself to storage', () => {
    useSettingsStore.getState().setSettings(demoSettings);

    // A tenant can change these at any time; a cached copy would send reports to
    // an address nobody is monitoring any more.
    expect(globalThis.localStorage.length).toBe(0);
  });
});
