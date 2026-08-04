import { afterEach, describe, expect, it } from 'vitest';
import { useReportStore } from './report.store';
import type { ReportDraft } from './report.types';

const draft: ReportDraft = { variant: 'spam', reasons: ['unwanted'], comment: 'nonsense' };

describe('useReportStore', () => {
  afterEach(() => {
    useReportStore.getState().reset();
  });

  it('starts empty, before a report has been drafted', () => {
    expect(useReportStore.getState().draft).toBeNull();
  });

  it('records what the drawer collected', () => {
    useReportStore.getState().setDraft(draft);

    expect(useReportStore.getState().draft).toEqual(draft);
  });

  it('replaces rather than merges, so a cleared note really clears', () => {
    useReportStore.getState().setDraft(draft);
    useReportStore.getState().setDraft({ variant: 'suspicious', reasons: [], comment: '' });

    expect(useReportStore.getState().draft).toEqual({ variant: 'suspicious', reasons: [], comment: '' });
  });

  it('clears the draft on reset, so a remount cannot file it twice', () => {
    useReportStore.getState().setDraft(draft);
    useReportStore.getState().reset();

    expect(useReportStore.getState().draft).toBeNull();
  });

  it('does not write itself to storage', () => {
    useReportStore.getState().setDraft(draft);

    // What a user thinks of one email is not worth keeping past the pane, and a
    // persisted draft would be re-filed the next time the pane opened.
    expect(Object.keys(localStorage)).not.toContainEqual(expect.stringContaining('report'));
  });
});
