/** The base URL every Graph call in this adapter is built from. */
export const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Hands over a Microsoft Graph access token, refreshing it if need be.
 *
 * Injected rather than imported so this folder never depends on `src/auth/`:
 * which of the two token flows is in play (NAA, or the Office dialog on clients
 * without it) is decided at start-up, and Graph does not care which one won.
 */
export type AccessTokenProvider = () => Promise<string>;

/**
 * The mailbox folders the confirmation screen can move a reported email to.
 *
 * Graph accepts these well-known names wherever a folder id is expected, which
 * is what makes the move possible without looking the folder up first -- and it
 * is the only form that works in every mailbox, since the ids differ per user
 * and the display names are localised.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/mailfolder} -- the well-known name list
 */
export type WellKnownFolder = 'deleteditems' | 'junkemail';

/** One file hung off a {@link NotificationMail}. */
export interface MailAttachment {
  /** The filename the recipient sees, e.g. `reported-email.eml`. */
  readonly name: string;
  /** The MIME type, e.g. `message/rfc822`. */
  readonly contentType: string;
  /** The bytes, exactly as they will be attached. */
  readonly content: Blob;
}

/**
 * A notification email, in the shape this adapter knows how to send.
 *
 * Deliberately not Graph's own `message` resource: the reporting flow decides
 * *what* to say, and this folder decides how Graph wants to hear it. Everything
 * Graph-specific -- the `saveToSentItems` flag, base64-encoding the attachment,
 * the `internetMessageHeaders` array shape -- happens on the other side of this
 * type.
 */
export interface NotificationMail {
  /** Where the report goes, from `settings.reportingMethods[].address`. */
  readonly to: string;
  /** The full subject, prefix already applied. */
  readonly subject: string;
  /** The body, as HTML. */
  readonly bodyHtml: string;
  /**
   * Custom headers marking the mail as ours, keyed by header name.
   *
   * Graph rejects any name that is not `X-`-prefixed and accepts at most five,
   * so this stays small on purpose -- it carries provenance, not payload.
   *
   * @see {@link https://learn.microsoft.com/graph/api/resources/internetmessageheader}
   */
  readonly headers: Readonly<Record<string, string>>;
  /** The original email as an `.eml`, when the reporting method asks for it. */
  readonly attachment?: MailAttachment | undefined;
}

/**
 * Everything the task pane asks of Microsoft Graph.
 *
 * The same seam as `MinervaAdapter`, for the same reason: `createAdapters()`
 * swaps the whole set for fixtures in demo mode, so the reporting flow can be
 * walked in a plain browser where no token can be acquired and -- more to the
 * point -- no mail may actually be sent.
 *
 * Graph covers precisely the three things Office.js will not do from a read-mode
 * task pane: hand over the raw MIME, send mail as the user, and move an item.
 *
 * @see {@link ./graph.demo.ts} -- the fixture implementation
 *
 * @example
 * ```ts
 * const { graph } = createAdapters(config, getAccessToken);
 * const mime = await graph.getMimeMessage(message.exchangeId);
 * ```
 */
export interface GraphAdapter {
  /**
   * Downloads the raw MIME of one message.
   *
   * This is the artefact the whole report is built on -- headers, routing and
   * all -- and it is the one thing Office.js cannot produce, which is why Graph
   * is in the picture at all.
   *
   * @param exchangeId The REST id, already converted from the Office.js EWS id.
   * @returns The message as `message/rfc822`.
   *
   * @see {@link https://learn.microsoft.com/graph/outlook-get-mime-message}
   *
   * @example
   * ```ts
   * const mime = await graph.getMimeMessage(message.exchangeId);
   * ```
   */
  getMimeMessage(exchangeId: string): Promise<Blob>;

  /**
   * Sends one notification email as the signed-in user.
   *
   * @param mail What to send, already templated.
   *
   * @see {@link https://learn.microsoft.com/graph/api/user-sendmail}
   *
   * @example
   * ```ts
   * await graph.sendMail({ to, subject, bodyHtml, headers: {} });
   * ```
   */
  sendMail(mail: NotificationMail): Promise<void>;

  /**
   * Moves a message into one of the well-known folders.
   *
   * What the confirmation screen's footer buttons do: delete a suspicious mail,
   * or file a spam one under junk.
   *
   * @param exchangeId The REST id of the message to move.
   * @param destination Where it should end up.
   *
   * @see {@link https://learn.microsoft.com/graph/api/message-move}
   *
   * @example
   * ```ts
   * await graph.moveMessage(message.exchangeId, 'junkemail');
   * ```
   */
  moveMessage(exchangeId: string, destination: WellKnownFolder): Promise<void>;
}
