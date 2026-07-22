import type { Meta, StoryObj } from '@storybook/react-vite';

const assets = import.meta.glob('../../assets/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const icons = import.meta.glob('../../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

function nameFromPath(path: string) {
  return path.split('/').pop()?.replace('.svg', '') ?? path;
}

/** Descriptions are placeholders to be refined once we settle on real copy per icon. */
const iconDescriptions: Record<string, string> = {};

function Gallery({ files, tileSize }: { files: Record<string, string>; tileSize: number }) {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-wrap gap-4">
      {entries.map(([path, svg]) => (
        <div
          key={path}
          className="flex flex-col items-center gap-2 rounded-md border border-neutral-200 p-4"
          style={{ width: tileSize + 32 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: tileSize, height: tileSize }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <span className="text-center text-xs text-neutral-500">{nameFromPath(path)}</span>
        </div>
      ))}
    </div>
  );
}

function IconsTable({ files }: { files: Record<string, string> }) {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-200">
          <th className="w-16 py-2 pr-4 font-medium text-neutral-500">Icon</th>
          <th className="py-2 pr-4 font-medium text-neutral-500">Label</th>
          <th className="py-2 font-medium text-neutral-500">Description</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([path, svg]) => {
          const name = nameFromPath(path);
          return (
            <tr key={path} className="border-b border-neutral-100">
              <td className="py-2 pr-4">
                <div
                  className="flex h-6 w-6 items-center justify-center"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </td>
              <td className="py-2 pr-4 font-mono text-xs">{name}</td>
              <td className="py-2 text-neutral-500">{iconDescriptions[name] ?? '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const meta = {
  title: 'General/Assets',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every non-icon asset (logos, illustrations, etc.) in `libs/ui/src/assets`. */
export const Assets: Story = {
  render: () => <Gallery files={assets} tileSize={96} />,
};

/** Every icon in `libs/ui/src/assets/icons`, discovered automatically — add a new SVG there and it shows up here. */
export const Icons: Story = {
  render: () => <IconsTable files={icons} />,
};
