import { Checkbox, type CheckboxProps } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * The box sits in a flex row next to the label and is sized in `px`, with nothing
 * stopping it from being squeezed. In a taskpane that can be as narrow as 220px a
 * label of any length would do exactly that, so the box is held at its own size and
 * the label is left to wrap beside it.
 */
const innerStyle = { flexShrink: 0 } as const;

export interface CheckboxWithLabelProps extends Omit<CheckboxProps, 'label'> {
  /**
   * The line beside the box — a string, or an element where part of it has to carry
   * a link. Required: a checkbox with nothing next to it says nothing about what
   * ticking it does.
   */
  label: ReactNode;
}

/**
 * @description A Mantine checkbox that always has its label — the house style for
 * a single opt-in. The box holds its size whatever the label does, so a line long
 * enough to wrap in a narrow pane cannot squash it into a sliver.
 *
 * `description`, `error`, `labelPosition` and the rest of the checkbox props still
 * apply; several of these belong in a `Checkbox.Group`, which is where the ones in
 * `UserFeedback` sit.
 *
 * @example
 * ```tsx
 * <CheckboxWithLabel label="Block this sender" onChange={block} />
 * ```
 */
export function CheckboxWithLabel({ label, size = 'sm', ...props }: CheckboxWithLabelProps) {
  return <Checkbox label={label} size={size} styles={{ inner: innerStyle }} {...props} />;
}

CheckboxWithLabel.displayName = 'CheckboxWithLabel';
