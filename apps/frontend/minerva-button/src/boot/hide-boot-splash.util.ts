import { BOOT_ELEMENT_ID } from '../constants/bootstrap.constants';

/**
 * Hides the splash `index.html` ships, once there is an app behind it.
 *
 * Hidden rather than removed, which is what it used to be. The splash is a
 * sibling of `#root` so that it survives React's first commit, because
 * {@link RootErrorBoundary} draws its last-resort screen by revealing this same
 * markup again -- a screen that renders no components cannot itself throw, which
 * is the whole reason it is trustworthy at that depth. Removing the node would
 * leave that boundary with nothing to show.
 *
 * The cost of keeping it is a hidden subtree for the life of the session, and
 * the loss of the old safety net where React clearing `#root` hid the spinner
 * even if this call was missed. Call it, and keep calling it, on every path that
 * reaches a first render.
 *
 * @example
 * ```ts
 * createRoot(container).render(<StrictMode>{tree}</StrictMode>);
 * hideBootSplash();
 * ```
 */
export function hideBootSplash(): void {
  document.getElementById(BOOT_ELEMENT_ID)?.setAttribute('hidden', '');
}
