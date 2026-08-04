/**
 * What runs before React does.
 *
 * The bootstrap's failure path lives here rather than in `main.tsx` so it can be
 * tested against real markup: none of it can use a component, because at this
 * point there is no tree to render one into. The ids it reaches for are in
 * `src/constants/bootstrap.constants.ts`, shared with `index.html`.
 */

export { showBootError } from './show-boot-error.util';
