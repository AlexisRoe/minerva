/*
  The ids `index.html` gives the splash it ships, and the only handle the
  bootstrap has on it. Nothing here is rendered by React: the failure path these
  name runs before there is a tree to render into, so the markup is the document's
  and these strings are the contract between the two files. Renaming one means
  renaming it in `index.html` in the same commit.
*/

/** The splash markup `index.html` ships, replaced by the first render. */
export const BOOT_ELEMENT_ID = 'minerva-boot';
/** The failure block inside it, revealed in place of the spinner. */
export const BOOT_ERROR_ELEMENT_ID = 'minerva-boot-error';
/** Where a `MinervaError`'s own wording goes, when there is one. */
export const BOOT_ERROR_MESSAGE_ELEMENT_ID = 'minerva-boot-error-message';
/** Where the `ERR_xxx` code goes, when the failure carries one. */
export const BOOT_ERROR_CODE_ELEMENT_ID = 'minerva-boot-error-code';
/** Where Sentry's event id goes, once the report has gone. */
export const BOOT_ERROR_ID_ELEMENT_ID = 'minerva-boot-error-id';
