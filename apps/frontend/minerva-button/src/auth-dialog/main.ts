/**
 * Entry point of the `/auth-dialog` page.
 *
 * The dialog is opened by Office through `displayDialogAsync` during the
 * MSAL/NAA sign-in flow: it completes the redirect and hands the result back to
 * the task pane via `messageParent`. That flow is not built yet — this only
 * signals readiness, which keeps the page a valid build entry and lets the
 * round trip be exercised end to end.
 *
 * `office.js` is loaded from Microsoft's CDN by auth-dialog.html and brings no
 * types with it (no `@types/office-js` in the workspace), hence the narrow
 * local declaration of the two members used here.
 */
interface OfficeGlobal {
  onReady: (callback: () => void) => void;
  context: { ui: { messageParent: (message: string) => void } };
}

const office = (globalThis as { Office?: OfficeGlobal }).Office;

office?.onReady(() => {
  office.context.ui.messageParent(JSON.stringify({ status: 'ready' }));
});
