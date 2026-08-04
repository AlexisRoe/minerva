import { vi } from 'vitest';

/** What {@link stubOffice} lets a test change about the host. */
export interface OfficeStubOptions {
  /** The open item, or `undefined` for a pane opened on nothing. */
  readonly item?: Partial<Office.MessageRead> | undefined;
  /** The mailbox owner, or `undefined` to leave the mailbox off entirely. */
  readonly userProfile?: Partial<Office.UserProfile> | undefined;
  /** Outlook's UI language, as a BCP-47 tag. */
  readonly displayLanguage?: string;
  /** Whether a mailbox exists at all -- `false` is a non-Outlook host. */
  readonly hasMailbox?: boolean;
  /** Answers `isSetSupported`, keyed `"<name>/<minVersion>"`; anything unlisted is unsupported. */
  readonly requirementSets?: Readonly<Record<string, boolean>>;
  /** Whether the dialog surface exists. */
  readonly hasUi?: boolean;
}

/** The parts of the fake a test may want to assert on. */
export interface OfficeStub {
  /** Records calls to `Office.context.ui.closeContainer()`. */
  readonly closeContainer: ReturnType<typeof vi.fn>;
  /** Records calls to `isSetSupported`, in the order they were asked. */
  readonly isSetSupported: ReturnType<typeof vi.fn>;
}

/**
 * Installs a minimal `Office` global, the way the host script would.
 *
 * Office.js is a global injected by Outlook, so there is nothing to import and
 * nothing to inject -- every test that exercises the adapter has to build one of
 * these. Doing it once here is what lets a case say only what it is about: a
 * missing mailbox, a language, an unsupported requirement set.
 *
 * Two Office-shaped tests deliberately do **not** use this and build their own:
 * `wait-for-office.util.test.ts` needs control over *when* `onReady` settles, and
 * `dialog.util.test.ts` needs to drive the dialog's event handlers. A builder
 * general enough for those would be harder to read than the fakes it replaced.
 *
 * `convertToRestId` prefixes rather than returning a fixed string, so a test can
 * tell a converted id from an unconverted one.
 *
 * @param options What this case is about; everything else takes a working default.
 * @returns The spies worth asserting on.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.mailbox}
 *
 * @example
 * ```ts
 * stubOffice({ userProfile: { displayName: 'Ada' }, displayLanguage: 'de-DE' });
 * ```
 */
export function stubOffice(options: OfficeStubOptions = {}): OfficeStub {
  const {
    item,
    userProfile = {},
    displayLanguage = 'en-US',
    hasMailbox = true,
    requirementSets = { 'Mailbox/1.13': true, 'NestedAppAuth/1.1': true },
    hasUi = true,
  } = options;

  const closeContainer = vi.fn();
  const isSetSupported = vi.fn((name: string, minVersion: string) => requirementSets[`${name}/${minVersion}`] === true);

  const mailbox = {
    item,
    userProfile,
    convertToRestId: (id: string, version: string) => `rest(${version}):${id}`,
  };

  vi.stubGlobal('Office', {
    MailboxEnums: { RestVersion: { v2_0: 'v2.0' } },
    context: {
      displayLanguage,
      mailbox: hasMailbox ? mailbox : undefined,
      requirements: { isSetSupported },
      ui: hasUi ? { closeContainer } : undefined,
    },
  });

  return { closeContainer, isSetSupported };
}
