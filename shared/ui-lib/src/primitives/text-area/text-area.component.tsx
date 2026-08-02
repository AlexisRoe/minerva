import { Textarea, type TextareaProps } from '@mantine/core';

/**
 * The field opens at three rows — enough to read as somewhere to write a sentence
 * or two — and grows with what is typed up to eight, after which it scrolls. The
 * ceiling is what keeps a long note from pushing the rest of the pane off the
 * bottom, which is the whole reason autosize needs one here.
 */
const minRows = 3;
const maxRows = 8;

export interface TextAreaProps extends TextareaProps {}

/**
 * @description A Mantine textarea that grows with what is typed, between a floor
 * and a ceiling — the house style for free text. `label`, `description`,
 * `placeholder`, `error` and the rest of the input props still apply, and passing
 * `minRows`/`maxRows` moves the bounds.
 *
 * @example
 * ```tsx
 * <TextArea label="Why are you reporting this mail?" placeholder="Anything that would help" />
 * ```
 */
export function TextArea({ size = 'sm', ...props }: TextAreaProps) {
  return <Textarea size={size} autosize minRows={minRows} maxRows={maxRows} {...props} />;
}

TextArea.displayName = 'TextArea';
