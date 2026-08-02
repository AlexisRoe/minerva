import { IconWorldOff } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { EmptyState, type EmptyStateProps } from '../../../primitives/empty-state/empty-state.component';

export interface NoContentViewProps extends Omit<EmptyStateProps, 'icon' | 'action' | 'children' | 'title'> {
  /** What there is nothing of, said in a line. */
  title: ReactNode;
}

/**
 * @description The pane with nothing in it: the struck-through globe over a title
 * and, where there is one, a line saying why. It is the `EmptyState` with the icon
 * settled and the way out taken off — this view is the end of the road, so it
 * carries no button. Like the block under it, it fills the height it is given, so
 * it wants a parent with one.
 *
 * `description`, `size`, `align`, `variant`, `color` and the Mantine style props
 * all still come through.
 *
 * @example
 * ```tsx
 * <NoContentView
 *   title="No mail open"
 *   description="Open a message to see what Minerva makes of it."
 * />
 * ```
 */
export function NoContentView({ title, ...rest }: NoContentViewProps) {
  return <EmptyState icon={IconWorldOff} title={title} {...rest} />;
}

NoContentView.displayName = 'NoContentView';
