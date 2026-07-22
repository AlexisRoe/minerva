import { IconWorldOff } from '@tabler/icons-react';
import type { ComponentProps } from 'react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../empty/empty';

export interface NotOutlookEnvironmentProps extends ComponentProps<typeof Empty> {
  /** Heading shown above the description, e.g. "Not running in Outlook". */
  title: string;
  /** Supporting copy explaining what the user should do instead. */
  description: string;
}

/** Empty-state shown when the add-in is opened outside of an Outlook host. */
export function NotOutlookEnvironment({ title, description, ...props }: NotOutlookEnvironmentProps) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <IconWorldOff className="size-24" stroke={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
