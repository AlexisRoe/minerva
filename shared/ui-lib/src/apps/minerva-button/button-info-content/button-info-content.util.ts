/**
 * A word, for the purpose of casing one. It runs from a letter or a digit through
 * whatever letters, digits and accents follow, and carries on across an apostrophe
 * so a contraction is cased as the one word it is rather than broken in half.
 * Everything else — spaces, hyphens, slashes, brackets — falls between words and is
 * handed back untouched, which leaves the spacing and punctuation exactly as given.
 */
const word = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’][\p{L}\p{N}\p{M}]+)*/gu;

/**
 * @description Cases a line the way a heading is written: every word opening with a
 * capital and running on in lower case. Anything already shouted comes back down —
 * `ADDRESS` reads `Address` — so a set of labels reads evenly however each one was
 * typed, which is the point of doing it here rather than at every call site.
 *
 * Only the letters are touched. Whatever sits between the words is left as it was,
 * so hyphens, brackets and double spaces survive, and a word that opens with a digit
 * keeps it. The casing is the invariant one rather than the host's, so a label reads
 * the same whichever machine renders it.
 *
 * @param text - the line to case, as it was given
 * @returns the same line with each word capitalised and the rest of it lower case
 *
 * @example
 * ```ts
 * toTitleCase('display name'); // 'Display Name'
 * toTitleCase('E-MAIL ADDRESS'); // 'E-Mail Address'
 * ```
 */
export function toTitleCase(text: string): string {
  return text.replace(word, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase());
}
