import type { Languages } from '@minerva/typescript-lib';

/**
 * Exactly what `Office.onReady()` resolves with, per the installed types.
 *
 * `@types/office-js` declares this shape inline on the `onReady` signature
 * instead of exporting a name for it, so it can only be reached by reading the
 * function's own type back. Doing that rather than transcribing the fields is
 * what makes a future change to the Office.js API a compile error here.
 */
type OfficeOnReadyResult = Awaited<ReturnType<typeof Office.onReady>>;

/**
 * What `Office.onReady()` reports about the application it resolved in.
 *
 * Derived from {@link OfficeOnReadyResult} rather than written out, so the field
 * names and their enum types stay tied to `@types/office-js`. The one thing
 * added is `null`: the declaration types both fields as always present, but
 * outside an Office host -- the page opened directly in a browser -- they arrive
 * as `null`, and that is precisely the case the start-up gate exists to catch.
 *
 * A caveat that costs nothing here but would elsewhere. `Office.HostType` and
 * `Office.PlatformType` are declared as *numeric* enums while Office.js really
 * assigns them strings (`'Outlook'`, `'OfficeOnline'`). Comparing against the
 * enum is still correct and is Microsoft's documented pattern, because both
 * sides read the same runtime object -- but TypeScript will not let either value
 * be used as a `string`, which is why {@link readEnvironment} renders them
 * explicitly before recording them.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/office#office-office-onready-function} -- the call this describes
 * @see {@link https://learn.microsoft.com/javascript/api/office/office.hosttype} -- the enum and how it is meant to be read
 */
export type OfficeReadyInfo = {
  readonly [Key in keyof OfficeOnReadyResult]: OfficeOnReadyResult[Key] | null;
};

/**
 * What the pane knows about the Outlook it is running inside.
 *
 * Read once at start-up and kept, because none of it can change while a pane is
 * open: the host does not switch applications, platforms or builds underneath a
 * running add-in. Only the facts that change a decision are carried -- the
 * requirement-set check is not among them, since failing it aborts start-up
 * rather than being recorded.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/office/office.contextinformation}
 */
export interface OfficeEnvironment {
  /** The Office application, e.g. `Outlook`. Always Outlook in practice. */
  readonly host: string;
  /** Where Outlook itself is running, e.g. `OfficeOnline`, `PC`, `Mac`, `iOS`. */
  readonly platform: string;
  /**
   * Whether Nested App Authentication is available.
   *
   * Decides which way the pane signs the user in: NAA where it is supported,
   * and the Office dialog otherwise. Not a failure either way.
   */
  readonly naaSupported: boolean;
}

/**
 * The slice of the open Outlook item the task pane actually works with.
 *
 * `Office.MessageRead` carries far more than the pane needs, and reaches it
 * through getters that only resolve inside a host. Narrowing to a plain object
 * at the adapter boundary is what lets the views and their tests run without
 * Office.js loaded at all.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.messageread}
 */
export interface OutlookMessage {
  /**
   * `item.itemId` — the host's own identifier for the open item.
   *
   * An EWS id on desktop, and **not** usable against Graph. Kept for logging and
   * for the Office.js calls that take it; {@link OutlookMessage.exchangeId} is
   * what the Graph adapter is queried with.
   */
  readonly id: string;
  /**
   * The same item as a REST identifier, for Graph.
   *
   * Produced by `Office.context.mailbox.convertToRestId()`. Every Graph call the
   * pane makes — fetching the MIME, moving the message — addresses the message
   * by this and never by {@link OutlookMessage.id}.
   */
  readonly exchangeId: string;
  /**
   * The RFC 5322 `Message-ID` header, as the transport assigned it.
   *
   * Stable across mailboxes, unlike either of the ids above, which is what lets
   * the backend recognise the same mail reported by two different people.
   */
  readonly internetMessageId: string;
  /** The message subject, shown to the user before they submit. */
  readonly subject: string;
  /** The sender's address, shown alongside the subject. */
  readonly from: string;
  /**
   * When the message was delivered, as an ISO-8601 string.
   *
   * `item.dateTimeCreated`, which for a received message is its delivery time —
   * this is what the reporting request sends as `deliveredAt`.
   */
  readonly receivedAt: string;
}

/**
 * Who has the pane open, as Outlook reports them.
 *
 * Taken from the host rather than from the signed-in Graph identity, because it
 * is available before authentication and is what the pane shows while it is
 * still signing in. The authenticated profile arrives later, from the backend.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.userprofile}
 */
export interface OutlookUser {
  /** The user's display name. */
  readonly name: string;
  /** The mailbox's primary SMTP address. */
  readonly email: string;
  /** The mailbox's time zone, e.g. `W. Europe Standard Time`. */
  readonly timeZone: string;
  /**
   * Outlook's UI language as a BCP-47 tag, e.g. `en-US`.
   *
   * The full tag, kept verbatim: the reporting request sends this rather than
   * {@link OutlookUser.language}, because the backend wants the region too.
   */
  readonly displayLanguage: string;
  /**
   * The same language reduced to a catalogue Minerva actually has.
   *
   * Anything unknown collapses onto the default rather than failing, so this is
   * always a language the i18n set-up can be switched to.
   */
  readonly language: Languages;
}

/**
 * Everything the host can tell the pane about itself, read in one go.
 *
 * One object rather than three calls because the three readings are only valid
 * together: the message and the user can only be read once Office.js is ready
 * and the environment has been checked, so returning them separately would
 * invite an order that cannot work.
 */
export interface OfficeHost {
  /** Which client the pane is running in, and what it supports. */
  readonly environment: OfficeEnvironment;
  /** The open message, or `null` when the pane was opened without one. */
  readonly message: OutlookMessage | null;
  /** Whose mailbox this is. */
  readonly user: OutlookUser;
}

/**
 * Everything the pane needs from the Office host, behind one seam.
 *
 * The counterpart to `MinervaAdapter` and `GraphAdapter`, and the reason demo
 * mode costs nothing above it: a screen holding one of these cannot tell whether
 * Office.js is on the page at all. Sign-in belongs here rather than beside it
 * because a Graph token is brokered *by the host* -- NAA asks Outlook for it,
 * and the dialog fallback opens an Office dialog -- so a pane with no host has
 * no token either.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/reference/javascript-api-for-office}
 *
 * @example
 * ```ts
 * const { environment, message, user } = await office.readHost();
 * ```
 */
export interface OfficeAdapter {
  /**
   * Waits for Office.js, checks the requirement set, reads the message and the user.
   *
   * The pane's first call, and the one that decides whether it can run here at
   * all: it throws {@link OfficeLoadTimeoutError},
   * {@link OfficeHostUnsupportedError} or {@link OfficeRequirementSetError} when
   * it cannot.
   *
   * @returns What the host reported.
   *
   * @example
   * ```ts
   * const host = await office.readHost();
   * ```
   */
  readHost(): Promise<OfficeHost>;

  /**
   * A Microsoft Graph access token for the signed-in user.
   *
   * Requires {@link OfficeAdapter.readHost} to have run: which sign-in flow is
   * available depends on what that reported about the client.
   *
   * @returns The bearer token, or an empty string in demo mode.
   *
   * @example
   * ```ts
   * const graph = createGraphHttpAdapter(() => office.acquireToken());
   * ```
   */
  acquireToken(): Promise<string>;

  /**
   * Closes the task pane.
   *
   * @example
   * ```ts
   * office.closePane();
   * ```
   */
  closePane(): void;
}
