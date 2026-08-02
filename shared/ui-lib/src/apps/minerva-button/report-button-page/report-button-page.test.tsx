import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ReportButtonPage } from './report-button-page.component';

function renderPage(ui: ReactElement) {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

/** The page as it is usually composed, with whatever the case at hand wants in its footer. */
function renderComposedPage(footer?: ReactNode) {
  return renderPage(
    <ReportButtonPage data-testid="page">
      <ReportButtonPage.Header>
        <span data-testid="mark">Report</span>
        <span>Action</span>
      </ReportButtonPage.Header>
      <ReportButtonPage.Content>Body</ReportButtonPage.Content>
      <ReportButtonPage.Footer>{footer}</ReportButtonPage.Footer>
    </ReportButtonPage>,
  );
}

describe('ReportButtonPage', () => {
  it('lays its parts out as a column filling the room it is given', () => {
    renderComposedPage(<button type="button">Send</button>);

    const page = screen.getByTestId('page');

    // `display: flex` is the `Flex` class's own, which jsdom does not load, so the
    // column it is turned into and the room it fills are what can be read here.
    expect(page).toHaveClass('mantine-Flex-root');
    expect(page).toHaveStyle({ flexDirection: 'column', height: '100%', width: '100%' });
  });

  it('renders the header as a banner, the content as an article and the footer as one', () => {
    const { container } = renderComposedPage(<button type="button">Send</button>);

    expect(screen.getByRole('banner')).toHaveTextContent('Report');
    expect(screen.getByRole('article')).toHaveTextContent('Body');
    expect(container.querySelector('footer')).toHaveTextContent('Send');
  });

  it('keeps the parts in the order they are read, the content between the two bands', () => {
    const { container } = renderComposedPage(<button type="button">Send</button>);

    const content = screen.getByRole('article');

    expect(content.previousElementSibling).toBe(screen.getByRole('banner'));
    expect(content.nextElementSibling).toBe(container.querySelector('footer'));
  });

  it('sets the header children apart, one at each end of the row', () => {
    renderComposedPage();

    // A `Group` sets its row through this variable rather than a plain declaration.
    expect(screen.getByRole('banner').style.getPropertyValue('--group-justify')).toBe('space-between');
  });

  it('takes a single child in the header, for a page with nothing at the other end', () => {
    renderPage(
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <span data-testid="mark">Report</span>
        </ReportButtonPage.Header>
        <ReportButtonPage.Content>Body</ReportButtonPage.Content>
      </ReportButtonPage>,
    );

    // Nothing to be set apart from, so the row simply opens with it.
    expect(screen.getByTestId('mark')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Report');
  });

  it('dresses both bands in the fill the drawer header is drawn with', () => {
    const { container } = renderComposedPage(<button type="button">Send</button>);

    // The two values are the theme's, named once for every band in the interface,
    // so neither the page nor the drawer states a colour of its own.
    expect(screen.getByRole('banner')).toHaveStyle({ background: 'var(--minerva-band-bg)' });
    expect(container.querySelector('footer')).toHaveStyle({ background: 'var(--minerva-band-bg)' });
  });

  it('draws the rule where each band meets the content it sits against', () => {
    const { container } = renderComposedPage(<button type="button">Send</button>);

    expect(screen.getByRole('banner').style.getPropertyValue('border-bottom')).toBe('var(--minerva-band-border)');
    expect(container.querySelector('footer')?.style.getPropertyValue('border-top')).toBe('var(--minerva-band-border)');
  });

  it('leaves the content as the only part that scrolls, so the bands stay put', () => {
    renderComposedPage(<button type="button">Send</button>);

    expect(screen.getByRole('article')).toHaveStyle({ overflowY: 'auto', minHeight: '0px' });
    expect(screen.getByRole('banner')).toHaveStyle({ flex: '0 0 auto' });
    expect(screen.getByRole('article')).toHaveStyle({ flex: '1 1 auto' });
  });

  it('draws no footer at all where there is nothing to put in it', () => {
    const { container } = renderComposedPage();

    // An empty band would read as a page that has a way on from it and lost it.
    expect(container.querySelector('footer')).toBeNull();
  });

  it('ends at its content where no footer is composed', () => {
    renderPage(
      <ReportButtonPage>
        <ReportButtonPage.Header>
          <span>Report</span>
        </ReportButtonPage.Header>
        <ReportButtonPage.Content>Body</ReportButtonPage.Content>
      </ReportButtonPage>,
    );

    expect(screen.getByRole('article').nextElementSibling).toBeNull();
  });

  it('lets a caller style override the layout it sets', () => {
    renderPage(
      <ReportButtonPage data-testid="page" style={{ display: 'grid' }}>
        <ReportButtonPage.Header style={{ borderBottom: '2px dashed red' }}>
          <span>Report</span>
        </ReportButtonPage.Header>
        <ReportButtonPage.Content style={{ overflowY: 'visible' }}>Body</ReportButtonPage.Content>
      </ReportButtonPage>,
    );

    expect(screen.getByTestId('page')).toHaveStyle({ display: 'grid' });
    expect(screen.getByRole('banner').style.borderBottom).toBe('2px dashed red');
    expect(screen.getByRole('article')).toHaveStyle({ overflowY: 'visible' });
  });

  it('takes Mantine props on every part, for a page that wants its own spacing', () => {
    const { container } = renderPage(
      <ReportButtonPage data-testid="page">
        <ReportButtonPage.Header p={0}>
          <span>Report</span>
        </ReportButtonPage.Header>
        <ReportButtonPage.Content p="xs">Body</ReportButtonPage.Content>
        <ReportButtonPage.Footer gap="xs">
          <button type="button">Send</button>
        </ReportButtonPage.Footer>
      </ReportButtonPage>,
    );

    expect(screen.getByRole('banner').style.padding).toBe('0rem');
    expect(screen.getByRole('article').style.padding).toBe('var(--mantine-spacing-xs)');
    expect(container.querySelector('footer')?.style.getPropertyValue('--group-gap')).toBe('var(--mantine-spacing-xs)');
  });

  it('forwards Box props and DOM attributes to each part', () => {
    const { container } = renderPage(
      <ReportButtonPage className="page" data-testid="page">
        <ReportButtonPage.Header className="page-header">
          <span>Report</span>
        </ReportButtonPage.Header>
        <ReportButtonPage.Content id="report-body">Body</ReportButtonPage.Content>
        <ReportButtonPage.Footer className="page-footer">
          <button type="button">Send</button>
        </ReportButtonPage.Footer>
      </ReportButtonPage>,
    );

    expect(screen.getByTestId('page')).toHaveClass('page');
    expect(screen.getByRole('banner')).toHaveClass('page-header');
    expect(screen.getByRole('article')).toHaveAttribute('id', 'report-body');
    expect(container.querySelector('footer')).toHaveClass('page-footer');
  });
});
