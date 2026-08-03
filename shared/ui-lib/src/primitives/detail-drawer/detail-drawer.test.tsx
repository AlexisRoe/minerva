import { IconFilter } from '@tabler/icons-react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MinervaThemeProvider } from '../../theme/minerva-provider.component';
import { DetailDrawer } from './detail-drawer.example';

describe('DetailDrawer', () => {
  it('renders its label and its content when opened', () => {
    render(
      <MinervaThemeProvider>
        <DetailDrawer opened label="Details" onClose={() => {}}>
          Panel body
        </DetailDrawer>
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Details');
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });

  it('renders the icon it is given', () => {
    render(
      <MinervaThemeProvider>
        <DetailDrawer opened label="Filters" icon={IconFilter} onClose={() => {}}>
          Panel body
        </DetailDrawer>
      </MinervaThemeProvider>,
    );

    expect(screen.getByRole('dialog').querySelector('svg.tabler-icon-filter')).not.toBeNull();
  });

  it('renders into the container it is given', () => {
    const container = document.createElement('div');
    document.body.append(container);

    render(
      <MinervaThemeProvider>
        <DetailDrawer opened label="Details" container={container} onClose={() => {}}>
          Panel body
        </DetailDrawer>
      </MinervaThemeProvider>,
    );

    expect(container).toContainElement(screen.getByRole('dialog'));
  });

  it('portals out of the story tree when it has no container', () => {
    const { container } = render(
      <MinervaThemeProvider>
        <DetailDrawer opened label="Details" onClose={() => {}}>
          Panel body
        </DetailDrawer>
      </MinervaThemeProvider>,
    );

    expect(container).not.toContainElement(screen.getByRole('dialog'));
  });
});
