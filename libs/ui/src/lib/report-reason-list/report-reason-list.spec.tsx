import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type ReportReason, ReportReasonList } from './report-reason-list';

const reasons: ReportReason[] = [
  { id: 'suspicious-link', label: 'Suspicious link or website' },
  { id: 'impersonation', label: 'Impersonates a person or company' },
];

describe('ReportReasonList', () => {
  it('renders every reason label', () => {
    render(<ReportReasonList reasons={reasons} />);

    expect(screen.getByText('Suspicious link or website')).toBeInTheDocument();
    expect(screen.getByText('Impersonates a person or company')).toBeInTheDocument();
  });

  it('calls onValueChange with the ticked reason id', async () => {
    const onValueChange = vi.fn();
    render(<ReportReasonList reasons={reasons} defaultValue={[]} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByText('Suspicious link or website'));

    expect(onValueChange).toHaveBeenCalledWith(['suspicious-link'], expect.anything());
  });

  it('renders reasons present in a controlled value as checked', () => {
    render(<ReportReasonList reasons={reasons} value={['impersonation']} onValueChange={() => {}} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false');
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true');
  });
});
