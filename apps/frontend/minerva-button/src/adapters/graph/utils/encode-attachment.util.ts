/**
 * Encodes a blob as the base64 string Graph wants an attachment's bytes in.
 *
 * Graph's `fileAttachment` carries `contentBytes` as base64 inside the JSON
 * body, so the `.eml` cannot simply be streamed -- it has to be read into memory
 * and re-encoded. `FileReader` is used rather than `btoa(await blob.text())`
 * because MIME is bytes, not text: reading it as a string would decode it as
 * UTF-8 first and corrupt every byte above 0x7F, which any non-ASCII subject or
 * binary attachment in the original mail will contain.
 *
 * @param blob The bytes to encode.
 * @returns The bytes as base64, with no data-URL prefix.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/fileattachment}
 * @see {@link https://developer.mozilla.org/docs/Web/API/FileReader/readAsDataURL}
 *
 * @example
 * ```ts
 * const contentBytes = await encodeAttachment(mimeBlob);
 * ```
 */
export async function encodeAttachment(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error('The attachment could not be read.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  // `data:<mediatype>;base64,<payload>` -- only the payload is wanted, and the
  // media type may itself contain a comma, so split on the last one.
  const separator = dataUrl.lastIndexOf(',');

  return separator === -1 ? '' : dataUrl.slice(separator + 1);
}
