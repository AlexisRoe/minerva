import type { UserFeedbackValue } from '@minerva/ui-lib';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoSettings } from '@/fixtures/demo/minerva.fixture';
import type { ReportSubmission } from '@/hooks/use-report-submission.hook';
import { useReportStore } from '@/stores/report/report.store';
import { useSettingsStore } from '@/stores/settings/settings.store';
import { useReportSubmission } from './use-report-submission.hook';

const navigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => navigate,
}));

/** A feedback block that has collected something valid. */
const validFeedback: UserFeedbackValue = {
  reasons: ['phishing', 'attachment'],
  comment: 'It asked for my password.',
  isValid: true,
};

/** Loads the demo settings, so `reasonsFor` has something to answer with. */
function renderWithSettings(): { current: ReportSubmission } {
  useSettingsStore.getState().setSettings(demoSettings);

  return renderHook(() => useReportSubmission()).result;
}

describe('useReportSubmission', () => {
  afterEach(() => {
    useSettingsStore.getState().reset();
    useReportStore.getState().reset();
    navigate.mockClear();
  });

  it('starts with the drawer shut and nothing to send', () => {
    const result = renderWithSettings();

    expect(result.current.filing).toBeNull();
    expect(result.current.canSend).toBe(false);
    expect(result.current.reasons).toEqual([]);
  });

  it('opens on the variant that was pressed, with that variant reasons', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('spam');
    });

    expect(result.current.filing).toBe('spam');
    expect(result.current.reasons).toEqual(
      demoSettings.userFeedback.reportingReasons.map(({ value, label }) => ({ value, label })),
    );
  });

  it('only allows sending once the feedback block says it is valid', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('suspicious');
      result.current.setFeedback({ ...validFeedback, isValid: false });
    });

    // The mandatory-reason rule lives in the feedback block; this asserts the
    // hook defers to it rather than deciding for itself.
    expect(result.current.canSend).toBe(false);
  });

  it('writes what the drawer collected to the store, then opens the confirmation', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('spam');
      result.current.setFeedback(validFeedback);
    });

    act(() => {
      result.current.sendReport();
    });

    // The reporting loader runs outside React and reads exactly this.
    expect(useReportStore.getState().draft).toEqual({
      variant: 'spam',
      reasons: ['phishing', 'attachment'],
      comment: 'It asked for my password.',
    });
    expect(navigate).toHaveBeenCalledWith('/confirmation');
  });

  it('shuts the drawer after sending, so the next report opens blank', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('spam');
      result.current.setFeedback(validFeedback);
    });

    act(() => {
      result.current.sendReport();
    });

    expect(result.current.filing).toBeNull();
    expect(result.current.canSend).toBe(false);
  });

  it('files nothing when there is no feedback to file', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('spam');
    });

    act(() => {
      result.current.sendReport();
    });

    // Reachable if a caller wires the send button without the disabled state.
    expect(useReportStore.getState().draft).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.filing).toBe('spam');
  });

  it('forgets what was typed when the report is cancelled', () => {
    const result = renderWithSettings();

    act(() => {
      result.current.startReport('spam');
      result.current.setFeedback(validFeedback);
    });

    act(() => {
      result.current.cancelReport();
    });

    act(() => {
      result.current.startReport('spam');
    });

    // A reopened drawer that still held the last report's note would attach it
    // to a different mail.
    expect(result.current.canSend).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
