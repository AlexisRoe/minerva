import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingReel } from './loading-reel';
import { STEP_TRANSLATIONS } from './loading-reel.constants';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('LoadingReel', () => {
  it('announces one of the known first-step translations', () => {
    render(<LoadingReel />);

    const possibleFirstSteps = Object.values(STEP_TRANSLATIONS).map((lang) => lang.steps[0]);
    const pattern = new RegExp(possibleFirstSteps.map(escapeRegExp).join('|'));

    expect(screen.getByRole('status')).toHaveTextContent(pattern);
  });

  it('renders a deterministic step for a single-language, single-step translation set', () => {
    const translations = { en: { rtl: false, steps: ['Only step'] } } as unknown as typeof STEP_TRANSLATIONS;
    render(<LoadingReel translations={translations} />);

    expect(screen.getByRole('status')).toHaveTextContent('Only step');
    expect(screen.getAllByText('Only step').length).toBeGreaterThan(1);
  });

  it('renders nothing when there are no steps to show', () => {
    const translations = { en: { rtl: false, steps: [] } } as unknown as typeof STEP_TRANSLATIONS;
    const { container } = render(<LoadingReel translations={translations} />);

    expect(container).toBeEmptyDOMElement();
  });
});
