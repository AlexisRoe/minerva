import { OfficeHostUnsupportedError, OfficeRequirementSetError } from '../../../errors';
import type { OfficeEnvironment, OfficeReadyInfo } from '../office.types';

/**
 * The Outlook API surface the pane is written against.
 *
 * 1.13 is what `manifest/manifest.local.xml` declares in its V1_1 version
 * overrides, and the two have to agree: the manifest decides where the add-in is
 * offered, this decides where it will actually run. Raising one without the
 * other either hides the add-in from clients that could run it, or admits
 * clients that cannot.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/requirement-sets/outlook/requirement-set-1.13/outlook-requirement-set-1.13}
 */
export const MAILBOX_REQUIREMENT_SET = { name: 'Mailbox', minVersion: '1.13' } as const;

/**
 * The requirement set that decides whether the pane can use NAA to sign in.
 *
 * Checked separately from {@link MAILBOX_REQUIREMENT_SET} and never fatal: it
 * is versioned on its own, is not declarable in the manifest, and its absence
 * selects the Office dialog fallback rather than ending start-up.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/requirement-sets/common/nested-app-auth-requirement-sets}
 */
export const NAA_REQUIREMENT_SET = { name: 'NestedAppAuth', minVersion: '1.1' } as const;

/**
 * Establishes that the pane can run here, and reports what "here" is.
 *
 * Both checks repeat something the manifest already claims to guarantee, and
 * both are worth repeating. `Office.context.mailbox` is absent whenever the page
 * was loaded as an ordinary web page rather than activated as a task pane, which
 * the manifest cannot prevent. And the Mailbox version gate is not airtight
 * either: an Exchange server can support a lower set than the client does, and
 * the manifest's outer `<Requirements>` block deliberately admits old clients
 * that never read the version overrides, so that they load the pane at all.
 *
 * Failing here is better than failing later. Without this, an unsupported client
 * reaches the report page and breaks on the first API call it does not have,
 * with nothing to tell the user why.
 *
 * @param info What `Office.onReady()` reported about the host.
 * @returns The environment facts the rest of the app decides on.
 * @throws {OfficeHostUnsupportedError} When the host is not Outlook.
 * @throws {OfficeRequirementSetError} When Outlook is older than Mailbox 1.13.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/requirement-sets/outlook/outlook-api-requirement-sets} -- checking sets at runtime
 *
 * @example
 * ```ts
 * const { naaSupported } = readEnvironment(await waitForOffice());
 * ```
 */
/**
 * Renders one of Office's enum members as the string it is at runtime.
 *
 * `Office.HostType` and `Office.PlatformType` are declared as numeric enums but
 * carry strings (`'Outlook'`, `'OfficeOnline'`), so they cannot simply be
 * assigned to a `string` field. Both are only ever recorded and logged here, so
 * rendering them is the honest conversion -- see {@link OfficeReadyInfo}.
 */
function label(value: Office.HostType | Office.PlatformType | null): string {
  return value === null ? 'unknown' : String(value);
}

export function readEnvironment(info: OfficeReadyInfo): OfficeEnvironment {
  const host = label(info.host);
  const platform = label(info.platform);

  if (Office.context?.mailbox === undefined) {
    throw new OfficeHostUnsupportedError(host, platform);
  }

  const { requirements } = Office.context;
  const { name, minVersion } = MAILBOX_REQUIREMENT_SET;

  if (!requirements.isSetSupported(name, minVersion)) {
    throw new OfficeRequirementSetError(name, minVersion, host, platform);
  }

  return {
    host,
    platform,
    naaSupported: requirements.isSetSupported(NAA_REQUIREMENT_SET.name, NAA_REQUIREMENT_SET.minVersion),
  };
}
