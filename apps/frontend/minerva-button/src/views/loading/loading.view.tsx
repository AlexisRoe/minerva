import { BrandLogo, LoadingIndicator, ReportButtonPage } from '@minerva/ui-lib';
import type React from 'react';
import { LOGO_SIZE } from '@/constants/icon-sizes.constants';

/** What the loading screen needs to say while the pane is not ready yet. */
interface LoadingViewProps {
  /** Mixed loading steps which are rotated through */
  steps: string[];
}

/**
 * @description The pane while it is still coming up: the mark in the header and a
 * reel of loading steps in its place. It is the same frame as every other screen,
 * so the pane does not jump when the wait ends and the real content takes over.
 *
 * The steps are the caller's, already translated — the view only passes them on.
 *
 * @example
 * ```tsx
 * <LoadingView steps={['Connecting to Outlook', 'Reading the message']} />
 * ```
 *
 * @see https://mantine.dev/ — the primitives behind the page frame, via `@minerva/ui-lib`.
 */
export function LoadingView({ steps }: LoadingViewProps): React.JSX.Element {
  return (
    <ReportButtonPage>
      <ReportButtonPage.Header>
        <BrandLogo size={LOGO_SIZE} />
      </ReportButtonPage.Header>

      <ReportButtonPage.Content>
        <LoadingIndicator steps={steps} />
      </ReportButtonPage.Content>
    </ReportButtonPage>
  );
}
