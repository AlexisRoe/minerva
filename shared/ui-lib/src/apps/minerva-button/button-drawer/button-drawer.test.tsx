import { type RenderResult, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MinervaThemeProvider } from '../../../theme/minerva-provider.component';
import { ButtonDrawer } from './button-drawer.component';

function renderDrawer(ui: ReactElement): RenderResult {
  return render(<MinervaThemeProvider>{ui}</MinervaThemeProvider>);
}

/** The element the drawer sets its own variables on, which is not the panel. */
function drawerRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.mantine-Drawer-root');
}

describe('ButtonDrawer', () => {
  it('renders its title and its content when opened', () => {
    renderDrawer(
      <ButtonDrawer opened title="Why this was flagged" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Why this was flagged');
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });

  it('sets the title like the h2 it renders, not like the copy under it', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    // The theme dresses every drawer title this way, so the panel gets it from
    // the provider rather than from anything the drawer sets itself.
    const title = screen.getByRole('heading', { level: 2 });

    expect(title).toHaveTextContent('Details');
    expect(title).toHaveStyle({
      fontFamily: 'var(--mantine-font-family-headings)',
      fontSize: 'var(--mantine-h2-font-size)',
      fontWeight: 'var(--mantine-h2-font-weight)',
    });
  });

  it('comes in from the right', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(drawerRoot()?.style.getPropertyValue('--drawer-justify')).toBe('flex-end');
  });

  it('takes the full width, less the offset it floats by', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(drawerRoot()?.style.getPropertyValue('--drawer-size')).toBe('calc(100% - var(--drawer-offset) * 2)');
  });

  it('sizes itself against the offset the theme sets, not one of its own', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(drawerRoot()?.style.getPropertyValue('--drawer-offset')).toBe('calc(0.75rem * var(--mantine-scale))');
  });

  it('follows an offset of its own where it is given one', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" offset={24} onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(drawerRoot()?.style.getPropertyValue('--drawer-offset')).toBe('calc(1.5rem * var(--mantine-scale))');
  });

  it('leaves the buttons to the footer it is given, and keeps none of its own', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('takes the close button back into the header when the footer is empty', () => {
    const onClose = vi.fn();

    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={onClose}>
        Panel body
      </ButtonDrawer>,
    );

    screen.getByRole('button', { name: 'Close' }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('puts the close button in the header rather than in the panel', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    const header = screen.getByRole('dialog').querySelector('.mantine-Drawer-header');

    expect(header).toContainElement(screen.getByRole('button', { name: 'Close' }));
  });

  it('puts nothing in the footer beyond what it is given', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    const footer = screen.getByRole('dialog').querySelector('footer');

    // No rule of its own above the buttons: what the content ends with is the
    // content's business, and the footer draws only what was handed to it.
    expect(footer?.children).toHaveLength(1);
    expect(footer?.firstElementChild).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('gives a single button the full width of the panel', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    // The column itself is Mantine's, off the `Stack` stylesheet the test
    // environment does not load, so what is checked is that the footer is that
    // stack and that it stretches what it is given across the row.
    const footer = screen.getByRole('dialog').querySelector<HTMLElement>('footer');

    expect(footer).toHaveClass('mantine-Stack-root');
    expect(footer?.style.getPropertyValue('--stack-align')).toBe('stretch');
    expect(footer?.style.getPropertyValue('--stack-gap')).toBe('var(--mantine-spacing-sm)');
  });

  it('stacks two buttons, each across the full width', () => {
    renderDrawer(
      <ButtonDrawer
        opened
        title="Details"
        onClose={() => {}}
        footer={[
          <button key="report" type="button">
            Report
          </button>,
          <button key="cancel" type="button">
            Cancel
          </button>,
        ]}
      >
        Panel body
      </ButtonDrawer>,
    );

    const footer = screen.getByRole('dialog').querySelector<HTMLElement>('footer');

    expect(footer).toHaveClass('mantine-Stack-root');
    expect(footer?.style.getPropertyValue('--stack-align')).toBe('stretch');
  });

  it('sets the header and the footer off from the content with a band of their own', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    const dialog = screen.getByRole('dialog');
    const header = dialog.querySelector<HTMLElement>('.mantine-Drawer-header');
    const footer = dialog.querySelector<HTMLElement>('footer');

    // The fill is the theme's, named once for every band in the interface, so
    // neither of these two names a colour of its own and both are certain to match.
    expect(header?.style.getPropertyValue('background')).toBe('var(--minerva-band-bg)');
    expect(footer?.style.getPropertyValue('background')).toBe('var(--minerva-band-bg)');
  });

  it('draws the rule where each band meets the content it sits against', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    const dialog = screen.getByRole('dialog');

    expect(dialog.querySelector<HTMLElement>('.mantine-Drawer-header')?.style.getPropertyValue('border-bottom')).toBe(
      'var(--minerva-band-border)',
    );
    expect(dialog.querySelector<HTMLElement>('footer')?.style.getPropertyValue('border-top')).toBe(
      'var(--minerva-band-border)',
    );
  });

  it('takes buttons wrapped in a fragment as the buttons they are', () => {
    renderDrawer(
      <ButtonDrawer
        opened
        title="Details"
        onClose={() => {}}
        footer={
          <>
            <button type="button">Report</button>
            <button type="button">Cancel</button>
          </>
        }
      >
        Panel body
      </ButtonDrawer>,
    );

    // A fragment leaves no element of its own, so both buttons are still the
    // footer's own children — which is what puts each of them across the row.
    const footer = screen.getByRole('dialog').querySelector('footer');
    const parents = screen.getAllByRole('button').map((button) => button.parentElement);

    expect(parents).toEqual([footer, footer]);
  });

  it('splits the panel into a column, with the scroll taken off it', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog')).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    });
  });

  it('scrolls the content and nothing else', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog').querySelector('.mantine-Drawer-body')).toHaveStyle({
      flex: '1 1 auto',
      minHeight: '0px',
      overflowY: 'auto',
    });
  });

  it('pins the footer under the content it scrolls', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<span>Buttons</span>}>
        Panel body
      </ButtonDrawer>,
    );

    const dialog = screen.getByRole('dialog');
    const body = dialog.querySelector('.mantine-Drawer-body');

    expect(body?.nextElementSibling).toBe(dialog.querySelector('footer'));
    expect(dialog.querySelector('footer')).toHaveStyle({ flex: '0 0 auto' });
  });

  it('draws no footer where it has nothing to put in one', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog').querySelector('footer')).toBeNull();
  });

  it('leaves the header out when it has neither a title nor a close button to put in it', () => {
    renderDrawer(
      <ButtonDrawer opened onClose={() => {}} footer={<button type="button">Close</button>}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog').querySelector('.mantine-Drawer-header')).toBeNull();
  });

  it('keeps a header for the close button alone when there is no title', () => {
    renderDrawer(
      <ButtonDrawer opened onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(screen.getByRole('dialog').querySelector('.mantine-Drawer-header')).not.toBeNull();
  });

  it('stands the content clear of the header, rather than starting against it', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}} footer={<span>Buttons</span>}>
        Panel body
      </ButtonDrawer>,
    );

    // Mantine drops this the moment the panel holds anything besides the body, so
    // the padding round the content is only even on all four sides because the
    // drawer puts the top one back.
    const body = screen.getByRole('dialog').querySelector<HTMLElement>('.mantine-Drawer-body');

    expect(body?.style.getPropertyValue('padding-top')).toBe('var(--mb-padding, var(--mantine-spacing-md))');
  });

  it('keeps that padding where there is no header either', () => {
    renderDrawer(
      <ButtonDrawer opened onClose={() => {}} footer={<span>Buttons</span>}>
        Panel body
      </ButtonDrawer>,
    );

    const body = screen.getByRole('dialog').querySelector<HTMLElement>('.mantine-Drawer-body');

    expect(body?.style.getPropertyValue('padding-top')).toBe('var(--mb-padding, var(--mantine-spacing-md))');
  });

  it('renders into the container it is given, and covers that instead of the page', () => {
    const container = document.createElement('div');
    document.body.append(container);

    renderDrawer(
      <ButtonDrawer opened title="Details" container={container} onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(container).toContainElement(screen.getByRole('dialog'));
    expect(container.querySelector('.mantine-Drawer-inner')).toHaveStyle({ position: 'absolute' });
  });

  it('portals out of the tree it is rendered in when it has no container', () => {
    const { container } = renderDrawer(
      <ButtonDrawer opened title="Details" onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(container).not.toContainElement(screen.getByRole('dialog'));
  });

  it('drops the overlay where it is told to', () => {
    renderDrawer(
      <ButtonDrawer opened title="Details" withOverlay={false} onClose={() => {}}>
        Panel body
      </ButtonDrawer>,
    );

    expect(document.querySelector('.mantine-Drawer-overlay')).toBeNull();
  });
});

describe('ButtonDrawer parts', () => {
  it('lays the same panel out by hand as the props do', () => {
    renderDrawer(
      <ButtonDrawer.Root opened onClose={() => {}}>
        <ButtonDrawer.Header>Details</ButtonDrawer.Header>
        <ButtonDrawer.Body>Panel body</ButtonDrawer.Body>
        <ButtonDrawer.Footer>
          <button type="button">Close</button>
        </ButtonDrawer.Footer>
      </ButtonDrawer.Root>,
    );

    const dialog = screen.getByRole('dialog');
    const body = dialog.querySelector('.mantine-Drawer-body');

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Details');
    expect(screen.getByText('Panel body')).toBeInTheDocument();
    expect(body?.previousElementSibling).toBe(dialog.querySelector('.mantine-Drawer-header'));
    expect(body?.nextElementSibling).toBe(dialog.querySelector('footer'));
    expect(dialog.querySelector<HTMLElement>('footer')?.style.getPropertyValue('background')).toBe(
      'var(--minerva-band-bg)',
    );
  });

  it('comes in from the right at the panel size, as the props-built one does', () => {
    renderDrawer(
      <ButtonDrawer.Root opened onClose={() => {}}>
        <ButtonDrawer.Body>Panel body</ButtonDrawer.Body>
      </ButtonDrawer.Root>,
    );

    expect(drawerRoot()?.style.getPropertyValue('--drawer-justify')).toBe('flex-end');
    expect(drawerRoot()?.style.getPropertyValue('--drawer-size')).toBe('calc(100% - var(--drawer-offset) * 2)');
    expect(drawerRoot()?.style.getPropertyValue('--drawer-offset')).toBe('calc(0.75rem * var(--mantine-scale))');
  });

  it('leaves the choice between a close button and a footer to whoever composes it', () => {
    const onClose = vi.fn();

    renderDrawer(
      <ButtonDrawer.Root opened onClose={onClose}>
        <ButtonDrawer.Header withCloseButton>Details</ButtonDrawer.Header>
        <ButtonDrawer.Body>Panel body</ButtonDrawer.Body>
        <ButtonDrawer.Footer>
          <button type="button">Report</button>
        </ButtonDrawer.Footer>
      </ButtonDrawer.Root>,
    );

    screen.getByRole('button', { name: 'Close' }).click();

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Report' })).toBeInTheDocument();
  });

  it('draws neither band where it is given nothing to put in one', () => {
    renderDrawer(
      <ButtonDrawer.Root opened onClose={() => {}}>
        <ButtonDrawer.Header />
        <ButtonDrawer.Body>Panel body</ButtonDrawer.Body>
        <ButtonDrawer.Footer />
      </ButtonDrawer.Root>,
    );

    const dialog = screen.getByRole('dialog');

    expect(dialog.querySelector('.mantine-Drawer-header')).toBeNull();
    expect(dialog.querySelector('footer')).toBeNull();
  });
});
