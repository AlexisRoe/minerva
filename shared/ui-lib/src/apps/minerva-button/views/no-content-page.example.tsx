import { BrandLogo } from '../../../primitives/brand-logo/brand-logo.component';
import { NoContentView } from '../no-content-view/no-content-view.component';
import { ReportButtonPage } from '../report-button-page/report-button-page.component';

/** The mark is sized for a pane that can be as narrow as 220px. */
const logoSize = 28;

/**
 * @description The taskpane with nothing to work on: the brand logo in the header,
 * then the empty view taking the rest of the page. It is what the pane shows when
 * it is open beside no mail — no buttons, because there is nothing yet to report.
 *
 * A story fixture standing in for the real page — it is not exported from the
 * library.
 *
 * @example
 * ```tsx
 * <NoContentPage />
 * ```
 */
export function NoContentPage() {
  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={logoSize} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <NoContentView title="No mail open" description="Open a message to see what Minerva makes of it." />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}

NoContentPage.displayName = 'NoContentPage';
