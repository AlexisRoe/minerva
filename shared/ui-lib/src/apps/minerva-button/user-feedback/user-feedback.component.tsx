import { Checkbox, type ElementProps, Stack, type StackProps, Title } from '@mantine/core';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { CheckboxWithLabel } from '../../../primitives/checkbox-with-label/checkbox-with-label.component';
import { TextArea } from '../../../primitives/text-area/text-area.component';

/** The list is the group's content, set off from its label the way an input would be. */
const reasonOffset = 'xs';

/** The list and the note are two blocks of one form, and stand apart as such. */
const blockGap = 'md';

export interface ReportingReason {
  /** What the report is filed under. This is what comes back in {@link UserFeedbackValue.reasons}. */
  value: string;
  /** The line beside the box. Takes an element, for a reason that has to carry a link. */
  label: ReactNode;
}

export interface UserFeedbackValue {
  /**
   * The ticked reasons, in the order the reasons were given rather than the order
   * they were ticked — the same picks always come back the same way.
   */
  reasons: string[];
  /** What was typed in the note; an empty string where there is none, or none was asked for. */
  comment: string;
  /**
   * Whether this may be sent on. False only while a mandatory list has nothing
   * ticked — hang whatever finishes the job on it.
   */
  isValid: boolean;
}

/**
 * `StackProps` carries the DOM's own `title` and `onChange` along with it, and this
 * block spends both on something of its own — a heading, and the value it hands
 * out. They are dropped on both sides and named again below.
 */
export interface UserFeedbackProps
  extends Omit<StackProps, 'title' | 'onChange'>,
    ElementProps<'div', 'onChange' | 'title'> {
  /**
   * What can be reported, in the order the boxes should be read. An empty list
   * draws no list at all, which is the case for a report that only takes a note.
   */
  reasons?: ReportingReason[];
  /**
   * Whether a reason has to be picked before the feedback may be sent. It marks
   * the list as required and holds `isValid` at false until something is ticked.
   * With no reasons to pick from it does nothing — a list that never arrived
   * cannot hold a report up.
   */
  isMandatory?: boolean;
  /** Whether to ask for a note as well. Left off, the block is the list alone. */
  hasUserInput?: boolean;
  /** The line over the whole block. Left out, nothing is drawn above the form. */
  title?: ReactNode;
  /** The label over the list of reasons. */
  reasonsLabel?: ReactNode;
  /** The label over the note. */
  inputLabel?: ReactNode;
  /** The grey line inside the empty note, saying what is worth writing there. */
  inputPlaceholder?: string;
  /** What a mandatory list says once it has been touched and left empty. */
  mandatoryError?: ReactNode;
  /**
   * Called with everything the block holds whenever any of it changes, starting
   * with the state it opens in — so a parent always has a current value without
   * having to wait for a first click.
   */
  onChange?: (value: UserFeedbackValue) => void;
}

/** Whether the value has actually moved, rather than merely been rebuilt by a render. */
function isSame(sent: UserFeedbackValue | null, value: UserFeedbackValue): boolean {
  return (
    sent !== null &&
    sent.comment === value.comment &&
    sent.isValid === value.isValid &&
    sent.reasons.length === value.reasons.length &&
    sent.reasons.every((reason, index) => reason === value.reasons[index])
  );
}

/**
 * @description What is asked of someone filing a report: the list of reasons to
 * tick, and under it a note in their own words. The reasons come first because
 * they are what the report is filed under — the note is what is left to say once
 * they have been picked. Either half can be left off — the list is drawn only
 * when there is something to put in it, the note only when it is asked for — so
 * the same block covers a report that takes only a set of reasons, only a
 * comment, or both.
 *
 * The block keeps its own answers. Everything it holds is handed to `onChange` as
 * one value, along with the only judgement it makes: whether a mandatory list has
 * been answered. A parent hangs its send button on that `isValid` and never has to
 * look inside. Where the list is mandatory it is marked as required, and once
 * somebody has been in it and left it empty it says so.
 *
 * Every string is the caller's. The root is a `Stack`, so Mantine style props (`m`,
 * `p`, …) work on it, and the gap between its blocks is a prop like any other.
 *
 * @example
 * ```tsx
 * const [feedback, setFeedback] = useState<UserFeedbackValue | null>(null);
 *
 * <UserFeedback
 *   title="Tell us what is wrong"
 *   isMandatory
 *   reasonsLabel="What is wrong with it?"
 *   reasons={[
 *     { value: 'sender', label: 'The sender is not who they claim to be' },
 *     { value: 'links', label: 'It asks me to follow a link' },
 *   ]}
 *   hasUserInput
 *   inputLabel="Anything else we should know?"
 *   inputPlaceholder="Anything that would help someone reading this later"
 *   onChange={setFeedback}
 * />
 *
 * <Button disabled={!feedback?.isValid} onClick={() => send(feedback)}>
 *   Report the mail
 * </Button>
 * ```
 */
export function UserFeedback({
  reasons = [],
  isMandatory = false,
  hasUserInput = false,
  title,
  reasonsLabel,
  inputLabel,
  inputPlaceholder,
  mandatoryError = 'Pick at least one reason.',
  onChange,
  ...rest
}: UserFeedbackProps) {
  const [ticked, setTicked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const sent = useRef<UserFeedbackValue | null>(null);

  const hasReasons = reasons.length > 0;
  const isIncomplete = isMandatory && hasReasons && ticked.length === 0;

  const value = useMemo<UserFeedbackValue>(
    () => ({
      reasons: reasons.filter((reason) => ticked.includes(reason.value)).map((reason) => reason.value),
      comment,
      isValid: !isIncomplete,
    }),
    [reasons, ticked, comment, isIncomplete],
  );

  useEffect(() => {
    if (isSame(sent.current, value)) return;

    sent.current = value;
    onChange?.(value);
  }, [value, onChange]);

  function handleReasons(next: string[]) {
    setTouched(true);
    setTicked(next);
  }

  return (
    <Stack gap={blockGap} {...rest}>
      {title && (
        <Title order={3} size="h5">
          {title}
        </Title>
      )}

      {hasReasons && (
        <Checkbox.Group
          label={reasonsLabel}
          withAsterisk={isMandatory}
          error={touched && isIncomplete ? mandatoryError : undefined}
          value={ticked}
          onChange={handleReasons}
        >
          <Stack gap="xs" mt={reasonOffset} mb={reasonOffset}>
            {reasons.map((reason) => (
              <CheckboxWithLabel key={reason.value} value={reason.value} label={reason.label} />
            ))}
          </Stack>
        </Checkbox.Group>
      )}

      {hasUserInput && (
        <TextArea
          label={inputLabel}
          placeholder={inputPlaceholder}
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
        />
      )}
    </Stack>
  );
}

UserFeedback.displayName = 'UserFeedback';
