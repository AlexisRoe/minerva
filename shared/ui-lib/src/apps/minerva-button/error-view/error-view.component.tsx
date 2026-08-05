import { Button, Stack, Text } from '@mantine/core';
import { IconSkull } from '@tabler/icons-react';
import type { MouseEventHandler, ReactNode } from 'react';
import { EmptyState, type EmptyStateProps } from '../../../primitives/empty-state/empty-state.component';

const referenceSize = 'xs';

export interface ErrorViewProps
  extends Omit<EmptyStateProps, 'icon' | 'action' | 'children' | 'title' | 'description'> {
  /** What went wrong, said in a line. */
  title: ReactNode;
  /** What it means for the person reading it. Takes a string or an element. */
  description?: ReactNode;
  /** The id of the run that failed — what support needs to find it. */
  errorId?: string;
  /** The code the failure came back with, such as `ERR_800`. */
  errorCode?: string;
  /** The label of the way out. Without it, and an action, no button is drawn. */
  buttonLabel?: string;
  /** What the button does. Without it, and a label, no button is drawn. */
  buttonAction?: MouseEventHandler<HTMLButtonElement>;
}

/**
 * @description The pane after something has failed: the skull over what went
 * wrong, the line explaining it, the references to quote at support, and — where
 * there is somewhere to go from here — a button.
 *
 * The references are dimmed and set small, under the copy rather than in it: they
 * are for the report that follows the failure, not for the person reading it, and
 * either can be left out. The button is drawn only when it has both a label and
 * something to do, so a view with no way out simply ends after the references.
 *
 * `size`, `align`, `variant`, `color` and the Mantine style props all still come
 * through. Like the block under it, it fills the height it is given.
 *
 * @example
 * ```tsx
 * <ErrorView
 *   title="Reporting failed"
 *   description="The mail was not sent on. Nothing has been reported."
 *   errorId="3f9a1c2e-7b4d-4e8a-9c1f-0a2b6d5e8c31"
 *   errorCode="ERR_800"
 *   buttonLabel="Try again"
 *   buttonAction={retry}
 * />
 * ```
 */
export function ErrorView({
  title,
  description,
  errorId,
  errorCode,
  buttonLabel,
  buttonAction,
  ...rest
}: ErrorViewProps): React.ReactElement {
  const hasReference = Boolean(errorId || errorCode);
  const hasButton = Boolean(buttonLabel && buttonAction);

  return (
    <EmptyState
      icon={IconSkull}
      title={title}
      description={description}
      action={hasButton ? <Button onClick={buttonAction}>{buttonLabel}</Button> : undefined}
      {...rest}
    >
      {hasReference && (
        <Stack component="section" gap="4xs">
          {errorId && (
            <Text size={referenceSize} c="dimmed">
              ID: {errorId}
            </Text>
          )}

          {errorCode && (
            <Text size={referenceSize} c="dimmed">
              ErrorCode: {errorCode}
            </Text>
          )}
        </Stack>
      )}
    </EmptyState>
  );
}

ErrorView.displayName = 'ErrorView';
