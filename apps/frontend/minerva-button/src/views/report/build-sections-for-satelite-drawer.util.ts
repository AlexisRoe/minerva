import type { ButtonInfoSection } from '@minerva/ui-lib';
import type { useTranslations } from '@/platform/i18n/hooks/use-translations.hook';
import type { useOffice } from '@/stores/session/hooks/use-office.hook';

/**
 * Builds the details drawer's blocks from what the host reported.
 *
 * A free function rather than inline JSX because it is data: the drawer renders
 * whatever sections it is handed, so this is the only place that decides what is
 * worth showing a user who is about to report something -- and what a support
 * call would want quoted back.
 */
export function buildSections(
  t: ReturnType<typeof useTranslations>['t'],
  office: Pick<ReturnType<typeof useOffice>, 'message' | 'user' | 'environment'>,
): ButtonInfoSection[] {
  const { message, user, environment } = office;

  const sections: ButtonInfoSection[] = [];

  if (user !== null) {
    sections.push({
      title: t('details.section.user.title'),
      entries: [
        { label: t('details.section.user.name'), value: user.name },
        { label: t('details.section.user.email'), value: user.email },
      ],
    });
  }

  if (message !== null) {
    sections.push({
      title: t('details.section.email.title'),
      entries: [
        { label: t('details.section.email.subject'), value: message.subject },
        { label: t('details.section.email.from'), value: message.from },
        { label: t('details.section.email.received'), value: message.receivedAt },
        { label: t('details.section.email.exchange-id'), value: message.exchangeId },
      ],
    });
  }

  if (environment !== null) {
    sections.push({
      title: t('details.section.environment.title'),
      entries: [
        { label: t('details.section.environment.host'), value: environment.host },
        { label: t('details.section.environment.platform'), value: environment.platform },
      ],
    });
  }

  return sections;
}
