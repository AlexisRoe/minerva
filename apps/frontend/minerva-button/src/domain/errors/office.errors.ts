import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors around Office.js and the host it is running in.
 *
 * These three are the start-up gate: unlike the configuration errors, they are
 * all conditions a user can meet through no fault of the deployment -- a blocked
 * CDN, the wrong Office application, an Outlook build that is too old. The
 * loader turns each of them into an explanatory screen rather than a crash,
 * which is why they carry the `logLevel` of a warning and not an error.
 *
 * One subclass per {@link ErrorCode}, and one hard-coded `reference` per class:
 * the reference identifies the *throw site*, so it stays constant for a given
 * class and is generated once with `uuidgen` when the class is written -- never
 * at runtime, or a log line could no longer be traced back to a line of code.
 *
 * @see {@link ./config.errors.ts} -- the same pattern, for the configuration
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/outlook/outlook-add-ins-overview}
 */

/**
 * Office.js never became ready within the allotted time.
 *
 * The library is fetched from Microsoft's CDN by a tag in `index.html`, so this
 * is what a blocked or unreachable `appsforoffice.microsoft.com` looks like from
 * inside the pane. It also covers the pane being opened outside Outlook
 * altogether, where the global is simply never installed.
 */
export class OfficeLoadTimeoutError extends MinervaError {
  constructor(timeoutMs: number, cause?: Error) {
    super({
      reference: '0e35eb50-2b4e-4d9d-9f04-91cbb1f77a09',
      code: 'ERR_007',
      message: 'Minerva could not reach Outlook.',
      logLevel: 'warn',
      payload: { timeoutMs },
      cause,
    });
  }
}

/**
 * Office.js is ready, but the host is not Outlook.
 *
 * The manifest activates the add-in on `Mailbox` only, so in practice this means
 * the page was opened directly in a browser rather than as a task pane.
 */
export class OfficeHostUnsupportedError extends MinervaError {
  constructor(host: string, platform: string, cause?: Error) {
    super({
      reference: 'c2f0b6a3-1c30-4f78-9bb1-5f19fb0a6d43',
      code: 'ERR_008',
      message: 'Minerva only runs inside Outlook.',
      logLevel: 'warn',
      payload: { host, platform },
      cause,
    });
  }
}

/**
 * The host was read before Office.js was ready.
 *
 * Pure wiring, and the only one of these that is not a user's circumstance:
 * everything that reads the host runs after the start-up gate has awaited
 * `waitForOffice()`, so `Office.context.mailbox` is established by then. Meeting
 * this means a reader was called from somewhere that skipped the gate -- a new
 * route without the loader, or a component reaching for the host directly.
 *
 * Fatal rather than recoverable, for the same reason `ConfigProviderMissingError`
 * is: there is no user action that fixes it.
 */
export class OfficeNotReadyError extends MinervaError {
  constructor(reader: string, cause?: Error) {
    super({
      reference: 'b7c4e0f2-5a91-4d38-8e6b-2c0a94f1d7e5',
      code: 'ERR_010',
      message: 'Minerva could not start.',
      logLevel: 'fatal',
      payload: { reader },
      cause,
    });
  }
}

/**
 * Outlook is too old for the APIs the pane depends on.
 *
 * The manifest gates activation on Mailbox 1.13, but that gate is not airtight:
 * an Exchange server can support a lower set than the client, and the fallback
 * `<Requirements>` block admits clients that never read the version overrides.
 * Checking again at runtime is what turns "the pane silently does nothing" into
 * a sentence the user can act on.
 */
export class OfficeRequirementSetError extends MinervaError {
  constructor(name: string, minVersion: string, host: string, platform: string, cause?: Error) {
    super({
      reference: '4a2d9c17-8e5b-4a06-b0c2-3d7f1e6a5b84',
      code: 'ERR_009',
      message: 'This version of Outlook is too old for Minerva.',
      logLevel: 'warn',
      payload: { name, minVersion, host, platform },
      cause,
    });
  }
}
