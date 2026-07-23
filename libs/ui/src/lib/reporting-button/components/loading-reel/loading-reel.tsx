import { useEffect, useMemo, useState } from 'react';
import { STEP_TRANSLATIONS } from './loading-reel.constants';
import styles from './loading-reel.module.css';
import { sortStepsWithMixingLanguages } from './loading-reel.util';

const ITEM_HEIGHT_PX = 52;
const VISIBLE_ITEMS = 3;
const TRANSITION_MS = 500;
const DEFAULT_INTERNAL_IN_MS = 1800;

export interface LoadingReelProps {
  /** Per-language step translations to mix. Defaults to the built-in supported languages. */
  translations?: typeof STEP_TRANSLATIONS;
  /** Time each step stays on screen before advancing, in milliseconds. */
  intervalMs?: number;
  /** Define how much visible items should be shown */
  visibleItems?: number;
  /** Transition in milliseconds */
  transition?: number;
}

/**
 * A slot-machine-style reel that scrolls through a mixed-language list of
 * loading steps, one row centered and highlighted at a time.
 *
 * The step list is tripled (`[...steps, ...steps, ...steps]`) so the reel can
 * keep scrolling forward with a CSS transition; once it scrolls past the
 * third copy, the position is jumped back by one copy-length with the
 * transition disabled, so the loop repeats without a visible seam.
 */
export function LoadingReel({
  translations = STEP_TRANSLATIONS,
  intervalMs = DEFAULT_INTERNAL_IN_MS,
  visibleItems = VISIBLE_ITEMS,
  transition = TRANSITION_MS,
}: LoadingReelProps) {
  const steps = useMemo(() => sortStepsWithMixingLanguages(translations), [translations]);
  const total = steps.length;
  const loopSteps = useMemo(() => [...steps, ...steps, ...steps], [steps]);

  const [current, setCurrent] = useState(total);
  const [withTransition, setWithTransition] = useState(false);

  useEffect(() => {
    setCurrent(total);
    setWithTransition(false);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setWithTransition(true);
      setCurrent((value) => value + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [total, intervalMs]);

  useEffect(() => {
    if (total === 0 || current < total * 2) return;

    const resetTimer = setTimeout(() => {
      setWithTransition(false);
      setCurrent((value) => value - total);
    }, transition);

    return () => clearTimeout(resetTimer);
  }, [current, total]);

  if (total === 0) return null;

  const viewportHeight = ITEM_HEIGHT_PX * visibleItems;
  const offset = viewportHeight / 2 - (current * ITEM_HEIGHT_PX + ITEM_HEIGHT_PX / 2);

  return (
    <div className={styles.container}>
      <div className={styles.viewport} style={{ height: viewportHeight }} aria-hidden="true">
        <div
          className={styles.track}
          style={{
            transform: `translateY(${offset}px)`,
            transition: withTransition ? `transform ${transition}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none',
          }}
        >
          {loopSteps.map((step, index) => (
            <div
              key={index}
              className={index === current ? styles.itemActive : styles.item}
              style={{ height: ITEM_HEIGHT_PX }}
            >
              <span className={styles.itemText}>{step}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        {steps[current % total]}
      </p>
    </div>
  );
}
