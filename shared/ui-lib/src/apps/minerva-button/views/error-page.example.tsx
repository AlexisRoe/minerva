import type { MouseEventHandler } from 'react';
import { BrandLogo } from '../../../primitives/brand-logo/brand-logo.component';
import { ErrorView } from '../error-view/error-view.component';
import { ReportButtonPage } from '../report-button-page/report-button-page.component';

/** The references the failed run came back with, quoted on the page and in the drawer. */
const mockError = {
  id: '3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31',
  code: 'ERR_800',
};

/** The mark is sized for a pane that can be as narrow as 220px. */
const logoSize = 28;

export interface ErrorPageProps {
  /** What to do about it. Without one, the page ends after the references. */
  onRetry?: MouseEventHandler<HTMLButtonElement>;
}

/**
 * @description The taskpane after something has failed: the brand logo in the
 * header, then the error view taking the rest of the page. The view carries the
 * references to quote at support, and draws its button only where there is
 * something for it to do — so the same page serves a failure that can be tried
 * again and one that cannot.
 *
 * A story fixture standing in for the real page — it is not exported from the
 * library.
 *
 * @example
 * ```tsx
 * <ErrorPage onRetry={() => report()} />
 * ```
 */
export function ErrorPage({ onRetry }: ErrorPageProps) {
  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={logoSize} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <ErrorView
          title="Reporting failed"
          description="The mail was not sent on, so nothing has been reported."
          errorId={mockError.id}
          errorCode={mockError.code}
          buttonLabel="Try again"
          buttonAction={onRetry}
        />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}

ErrorPage.displayName = 'ErrorPage';
