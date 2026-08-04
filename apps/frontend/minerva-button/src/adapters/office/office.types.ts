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
