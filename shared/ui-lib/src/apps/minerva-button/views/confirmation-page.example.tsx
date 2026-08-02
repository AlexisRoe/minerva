import { BrandLogo } from '../../../primitives/brand-logo/brand-logo.component';
import { ConfirmationView, type ConfirmationViewProps } from '../confirmation-view/confirmation-view.component';
import type { ReportButtonVariant } from '../report-button/report-button.component';
import { ReportButtonPage } from '../report-button-page/report-button-page.component';

/** The mark is sized for a pane that can be as narrow as 220px. */
const logoSize = 28;

/**
 * What the pane says once each kind of report has gone. A suspicious mail is
 * looked at by somebody, so there is something to say about what follows; spam
 * is filed and forgotten, so that section is simply left off.
 */
const confirmations = {
  suspicious: {
    title: 'Thanks for reporting',
    description: 'The mail is on its way to the security team.',
    statusMessage: 'It has been moved out of your inbox into Deleted Items.',
    detailsTitle: 'What happens next',
    details: [
      'The security team looks at the mail.',
      'You hear back only if they need something from you.',
      'Anything else that looks like it can be reported the same way.',
    ],
  },
  spam: {
    title: 'Reported as spam',
    description: 'Mail like it should stop reaching your inbox.',
    statusMessage: 'It has been moved out of your inbox into Junk Email.',
  },
} satisfies Record<ReportButtonVariant, ConfirmationViewProps>;

export interface ConfirmationPageProps {
  /** Which report has just gone. Decides what the page has to say about it. */
  reportedAs?: ReportButtonVariant;
}

/**
 * @description The taskpane after a report has gone: the brand logo in the header,
 * then the confirmation taking the rest of the page. It is the end of the run —
 * the mail has been sent on and there is nothing left to press, so the page
 * carries no button.
 *
 * What it says depends on which report went. Both say where the mail ended up;
 * only the suspicious one has anything to add about what follows, and the spam
 * one shows what the view looks like with that section left off.
 *
 * A story fixture standing in for the real page — it is not exported from the
 * library.
 *
 * @example
 * ```tsx
 * <ConfirmationPage reportedAs="spam" />
 * ```
 */
export function ConfirmationPage({ reportedAs = 'suspicious' }: ConfirmationPageProps) {
  const confirmation = confirmations[reportedAs];

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={logoSize} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <ConfirmationView {...confirmation} />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}

ConfirmationPage.displayName = 'ConfirmationPage';
