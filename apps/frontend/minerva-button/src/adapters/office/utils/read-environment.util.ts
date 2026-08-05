import type { OfficeEnvironment, OfficeReadyInfo } from '@/adapters/office/office.types';
import { MAILBOX_REQUIREMENT_SET, NAA_REQUIREMENT_SET } from '@/constants/office-js.constants';
import { OfficeHostUnsupportedError, OfficeRequirementSetError } from '@/domain/errors/office.errors';

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
