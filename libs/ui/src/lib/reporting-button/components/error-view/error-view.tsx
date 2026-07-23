import { IconSkull } from '@tabler/icons-react';
import type { ComponentProps } from 'react';
import { Button } from '../../../base/components/button/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../../base/components/empty/empty';
import { cn } from '../../../utils/cn';

export interface ErrorViewProps extends ComponentProps<typeof Empty> {
  /** Heading shown above the description, e.g. "Something went wrong". */
  title: string;
  /** Supporting copy explaining what happened. */
  description: string;
  /** Identifier (e.g. a UUID) shown dimmed for support purposes. */
  id: string;
  /** Error code shown dimmed for support purposes. */
  errorCode: string;
  /** Label for the action button. */
  buttonText: string;
  /** Called when the action button is clicked. */
  onButtonClick: () => void;
}

/** Empty-state shown when an unrecoverable error occurs, with support reference details and a retry action. */
export function ErrorView({
  title,
  description,
  id,
  errorCode,
  buttonText,
  onButtonClick,
  className,
  ...props
}: ErrorViewProps) {
  return (
    <Empty className={cn('w-full max-w-none border-none p-0', className)} {...props}>
      <EmptyHeader className="w-full max-w-none">
        <EmptyMedia variant="default">
          <IconSkull className="size-24" stroke={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="w-full">{description}</EmptyDescription>
        <EmptyDescription className="w-full text-[10px] text-muted-foreground/60">
          <span className="font-semibold">Id: </span>
          {id}
          <br />
          <span className="font-semibold">Error code: </span>
          {errorCode}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onButtonClick}>{buttonText}</Button>
      </EmptyContent>
    </Empty>
  );
}
