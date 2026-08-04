import type { AuthorizationResult, MinervaButtonSettings, ReportingResponse } from '@minerva/typescript-lib';

import { demoAuthorization, demoReportingResponse, demoSettings } from '../../demo';
import type { MinervaAdapter } from './minerva.types';

/**
 * How long a demo call pretends to take, in milliseconds.
 *
 * Not zero on purpose. The loading screens are a real part of this product --
 * the boot sequence and the reporting flow each have a six-step reel -- and an
 * adapter that answered instantly would make them flash past unread, which is
 * the opposite of what a demo is for.
 */
export const DEMO_LATENCY_MS = 600;

/** Resolves after {@link DEMO_LATENCY_MS}, so the loading screens are legible. */
function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY_MS));
}

/**
 * A {@link MinervaAdapter} that answers from fixtures and never touches the network.
 *
 * Selected by `createAdapters()` when `config.demo` is on, which needs both the
 * deployment's `allowDemo` and `?demo=true` in the URL. It is what makes the
 * pane demonstrable at all today: the three endpoints it stands in for do not
 * exist on the API yet.
 *
 * `submitReport` accepts and discards its argument rather than validating it.
 * Checking the form here would be inventing a contract the real backend has not
 * agreed to, and getting that wrong is worse than not checking.
 *
 * @returns The fixture implementation of the Minerva adapter.
 *
 * @see {@link ./minerva.http.ts} -- the real one
 *
 * @example
 * ```ts
 * const minerva = createMinervaDemoAdapter();
 * ```
 */
export function createMinervaDemoAdapter(): MinervaAdapter {
  return {
    async authorize(): Promise<AuthorizationResult> {
      await pause();

      return demoAuthorization;
    },

    async getSettings(): Promise<MinervaButtonSettings> {
      await pause();

      return demoSettings;
    },

    async submitReport(): Promise<ReportingResponse> {
      await pause();

      return demoReportingResponse;
    },
  };
}
