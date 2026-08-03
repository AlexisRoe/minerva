/**
 * Conversion between the language tags Minerva receives from the outside world
 * and the small internal {@link Languages} name space the i18n catalogues use.
 *
 * Every source hands us something slightly different -- browsers send BCP-47
 * tags, Office.js and the Graph API send their own casing and the occasional
 * underscore -- so nothing outside this file should read those values directly.
 * Anything unknown, malformed or missing resolves to {@link DEFAULT_LANGUAGE}
 * rather than throwing: a task pane in the wrong language is recoverable, a
 * crash on start-up is not.
 *
 * Every format handled here is a variation on the same standard:
 * - BCP 47 / RFC 5646, the tag grammar itself:
 *   {@link https://www.rfc-editor.org/rfc/rfc5646#section-2.2.1}
 * - RFC 4647, the "lookup" matching scheme this module implements the truncating
 *   half of: {@link https://www.rfc-editor.org/rfc/rfc4647#section-3.4}
 * - RFC 1766 and RFC 4646, the older revisions Microsoft's docs still cite:
 *   {@link https://www.rfc-editor.org/rfc/rfc1766} and
 *   {@link https://www.rfc-editor.org/rfc/rfc4646}
 */

import { isNonEmptyString } from '../validators/validator.utils';
import { DEFAULT_LANGUAGE, Languages } from './available-languages';

/** Every internal tag, used to check a candidate before widening it to `Languages`. */
const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set<string>(Object.values(Languages));

/**
 * The internal language a tag names, or `undefined` when Minerva has none.
 *
 * Kept private because callers should not have to tell "no catalogue" apart
 * from "English": the exported wrappers collapse both onto the fallback.
 *
 * Only the primary language subtag matters -- it is always first and always the
 * only mandatory part of a tag (RFC 5646 §2.2.1), and the catalogues are keyed
 * per language, not per region or script, so `de-AT`, `de_DE` and `zh-Hans-CN`
 * all collapse onto their base language. This is the truncating half of the RFC
 * 4647 §3.4 "lookup" scheme, stopped at the first subtag.
 *
 * Both the BCP-47 hyphen and the underscore Microsoft emits in alternate-sort
 * names such as `es-ES_tradnl` count as separators, and matching is
 * case-insensitive: tags are case-insensitive by RFC 5646 §2.1.1, and Microsoft
 * really does return both `de-DE` and `de-de` in practice.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646#section-2.2.1} -- primary language subtag
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647#section-3.4} -- lookup matching
 * @see {@link https://learn.microsoft.com/en-us/globalization/locale/other-locale-names} -- Microsoft's underscore forms
 */
function toSupportedLanguage(input: unknown): Languages | undefined {
  if (isNonEmptyString(input) === false) {
    return undefined;
  }

  const [primarySubtag = ''] = input.trim().toLowerCase().split(/[-_]/);

  return SUPPORTED_LANGUAGES.has(primarySubtag) ? (primarySubtag as Languages) : undefined;
}

/**
 * Reduces any language tag to the internal name space.
 *
 * The general-purpose converter behind the source-specific ones below: use it
 * whenever a tag reaches Minerva from somewhere without its own helper, such as
 * an `Accept-Language` header or a value stored with a user profile.
 *
 * @param input - A language tag from any source; non-strings are tolerated.
 * @returns The matching internal language, or {@link DEFAULT_LANGUAGE} if the
 * tag is unusable or names a language Minerva has no catalogue for.
 *
 * @example
 * ```ts
 * convertLanguageTagToInternalLanguage('de-AT');      // Languages.German
 * convertLanguageTagToInternalLanguage('zh-Hans-CN'); // Languages.Mandarin
 * convertLanguageTagToInternalLanguage('ja-JP');      // Languages.English -- no catalogue
 * convertLanguageTagToInternalLanguage(undefined);    // Languages.English
 * ```
 */
export function convertLanguageTagToInternalLanguage(input: unknown): Languages {
  return toSupportedLanguage(input) ?? DEFAULT_LANGUAGE;
}

/**
 * The parts of `navigator` this module reads.
 *
 * Narrow on purpose, so a caller outside the browser can hand over anything
 * carrying the same two fields without having to fake a whole `Navigator`.
 */
export interface BrowserLanguageSource {
  /** The preference list, in descending order. */
  readonly languages?: readonly string[] | undefined;
  /** The single preferred tag, for sources that expose no list. */
  readonly language?: string | undefined;
}

/**
 * Picks the language the browser asks for.
 *
 * `languages` is the user's preference list in descending order, so the first
 * entry Minerva has a catalogue for wins -- someone who prefers Japanese but
 * also reads German gets German rather than the English fallback. `language`
 * covers the older browsers and the runtimes that expose only the single value.
 *
 * Meant for the browser entry points, where it feeds the i18n set-up before the
 * first render, and reads the ambient `navigator` by default. Where there is no
 * browser window -- the server, a worker, a test -- pass the source in: any
 * object with `languages` and/or `language` works, so an `Accept-Language`
 * header split into a list can be handed over as-is.
 *
 * Both fields are specified as valid BCP 47 tags, and the HTML standard lets
 * `languages` be an empty list and lets either value be a deliberately coarse
 * or fingerprint-resistant approximation of the real setting, which is why an
 * empty or unmatched list is a normal outcome here rather than an error.
 *
 * @param source - Where to read the preferences from. Defaults to the ambient
 * `navigator`, which is absent outside the browser.
 * @returns The best supported match, or {@link DEFAULT_LANGUAGE} when nothing
 * matches and when no source is available at all.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/system-state.html#dom-navigator-languages} -- `navigator.languages`, HTML Living Standard
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages} -- MDN, including browser support
 *
 * @example
 * ```ts
 * // In the browser: navigator.languages === ['ja-JP', 'de-AT', 'en-US']
 * i18n.init({ lng: detectBrowserLanguage() }); // Languages.German
 *
 * // Without a window, from a request header:
 * detectBrowserLanguage({ languages: parseAcceptLanguage(request.headers) });
 * ```
 */
export function detectBrowserLanguage(source: BrowserLanguageSource | undefined = globalThis.navigator): Languages {
  if (source === undefined || source === null) {
    return DEFAULT_LANGUAGE;
  }

  const preferences = Array.isArray(source.languages) ? source.languages : [source.language];

  for (const preference of preferences) {
    const supported = toSupportedLanguage(preference);
    if (supported !== undefined) {
      return supported;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Converts a language reported by Microsoft into the internal name space.
 *
 * All of Microsoft's language fields are the same tag grammar under different
 * names, so one converter covers them:
 * - Office.js `Office.context.displayLanguage` and `Office.context.contentLanguage`
 *   are documented as RFC 1766 language tags, e.g. `en-US`.
 * - Graph `user.preferredLanguage` is documented as RFC 4646: an ISO 639
 *   lowercase language plus an ISO 3166 uppercase region, e.g. `en-US`, `es-ES`.
 * - Graph `user.mailboxSettings.language.locale` carries the same form.
 *
 * RFC 1766 and RFC 4646 are both superseded by BCP 47 / RFC 5646 and remain
 * prefix-compatible with it, so truncating to the primary subtag is valid for
 * every one of them. Beyond the plain `language-REGION` form the docs advertise,
 * these three shapes actually turn up and are all handled:
 * - script and three-part tags -- `zh-Hans`, `zh-Hans-CN`, `sr-Latn-RS`
 * - inconsistent casing -- `de-de` alongside `de-DE`
 * - Windows alternate-sort names, which use an underscore -- `es-ES_tradnl`
 *
 * Two limits worth knowing. Numeric LCIDs (`1031` for German) are not decoded:
 * the modern APIs above return strings, and mapping the numbers needs the full
 * [MS-LCID] table, so a legacy caller has to convert before calling here. And
 * script is discarded along with everything else after the primary subtag, so
 * `zh-TW` (Traditional) resolves to the same {@link Languages.Mandarin}
 * catalogue as `zh-CN` (Simplified) -- fix that by splitting the catalogue, not
 * by changing this function.
 *
 * The value comes straight out of a network response or a host object, so
 * `unknown` is the honest input type and the optional chain that produced it
 * can stay: an unset mailbox language is normal, not exceptional.
 *
 * @param input - Whatever the Microsoft response carried in the language field.
 * @returns The matching internal language, or {@link DEFAULT_LANGUAGE}.
 *
 * @see {@link https://learn.microsoft.com/en-us/javascript/api/office/office.context#office-office-context-displaylanguage-member} -- Office.js `displayLanguage` (RFC 1766)
 * @see {@link https://learn.microsoft.com/en-us/graph/api/resources/user} -- Graph `preferredLanguage` (RFC 4646)
 * @see {@link https://learn.microsoft.com/en-us/graph/api/resources/mailboxsettings} -- Graph `mailboxSettings.language`
 * @see {@link https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-lcid/70feba9f-294e-491e-b6eb-56532684c37f} -- [MS-LCID], the locale-name and LCID reference
 *
 * @example
 * ```ts
 * // 'de-DE' -> Languages.German
 * convertMicrosoftLanguagetoInternalLanguage(Office.context.displayLanguage);
 *
 * // missing on the mailbox -> Languages.English
 * convertMicrosoftLanguagetoInternalLanguage(user.mailboxSettings?.language?.locale);
 * ```
 */
export function convertMicrosoftLanguagetoInternalLanguage(input: unknown): Languages {
  return convertLanguageTagToInternalLanguage(input);
}
