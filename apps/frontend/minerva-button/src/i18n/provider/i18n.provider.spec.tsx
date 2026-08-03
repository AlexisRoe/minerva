import { DEFAULT_LANGUAGE, Languages } from '@minerva/typescript-lib';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useTranslations } from '../hooks/use-translations.hook';
import { changeLanguage } from '../utils/change-language.util';
import { I18nProvider } from './i18n.provider';

function Probe() {
  const { t } = useTranslations();

  return <span>{t('submit')}</span>;
}

// This runs before Testing Library's auto-cleanup, so the tree rendered by the
// test is still mounted and re-renders on the language change -- hence `act`.
afterEach(async () => {
  await act(async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  });
});

describe('I18nProvider', () => {
  it('serves the configured instance to its children', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByText('Send to Minerva')).toBeInTheDocument();
  });

  it('re-renders its children when the language changes', async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await act(async () => {
      await changeLanguage(Languages.German);
    });

    expect(screen.getByText('An Minerva senden')).toBeInTheDocument();
  });
});
