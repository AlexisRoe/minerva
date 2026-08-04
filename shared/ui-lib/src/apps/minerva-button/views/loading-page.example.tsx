import { useMemo } from 'react';
import { BrandLogo } from '../../../primitives/brand-logo/brand-logo.component';
import { LoadingIndicator } from '../loading-indicator/loading-indicator.component';
import { STEP_TRANSLATIONS } from '../loading-indicator/loading-indicator.example';
import { mixLanguages } from '../loading-indicator/loading-indicator.util';
import { ReportButtonPage } from '../report-button-page/report-button-page.component';

/** The mark is sized for a pane that can be as narrow as 220px. */
const logoSize = 28;

export interface LoadingPageProps {
  /**
   * What the pane says it is doing while it waits. Left out, the startup sequence
   * is mixed out of the languages it is known in.
   */
  steps?: string[];
  /** How long each step stays on screen before the next one comes round, in milliseconds. */
  intervalMs?: number;
}

/**
 * @description The taskpane before there is anything to show: the brand logo in
 * the header, and the rest of the page given over to the reel of what is being
 * waited on. The header is already there, so the pane looks like itself from the
 * first frame and only its content is missing.
 *
 * The indicator centres itself in the room it is given, which here is everything
 * under the divider — so the wait sits in the middle of the pane rather than at
 * the top of it.
 *
 * The steps are drawn from `mixLanguages`, which gives the startup sequence with a
 * language picked afresh for each step. The mix is made once, when the page opens:
 * the reel would otherwise be handed a different list on every render and change
 * its words under the reader.
 *
 * A story fixture standing in for the real page — it is not exported from the
 * library.
 *
 * @example
 * ```tsx
 * <LoadingPage />
 * ```
 */
export function LoadingPage({ steps, intervalMs }: LoadingPageProps): React.ReactElement {
  const mixed = useMemo(() => mixLanguages(STEP_TRANSLATIONS), []);

  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={logoSize} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <LoadingIndicator steps={steps ?? mixed} intervalMs={intervalMs} />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}

LoadingPage.displayName = 'LoadingPage';
