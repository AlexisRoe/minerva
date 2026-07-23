Here's the fuller picture — primary NAA path, dialog-based fallback, and the Vite config to support both.

**vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        authDialog: resolve(__dirname, 'auth-dialog.html'), // no React here
      },
    },
  },
});
```

**auth-dialog.html** (project root, sibling to `index.html`)

Office Dialogs need Office.js loaded to call `messageParent` — this is the one place a CDN script tag is actually the right call, since it's the platform bridge, not MSAL itself.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Signing in…</title>
</head>
<body>
  <p>Signing in…</p>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <script type="module" src="/src/auth-dialog/main.ts"></script>
</body>
</html>
```

**src/auth-dialog/msalDialogConfig.ts**

```ts
import type { Configuration } from '@azure/msal-browser';

export const msalDialogConfig: Configuration = {
  auth: {
    clientId: 'YOUR_AZURE_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: '/auth-dialog.html', // same page redirects back to itself
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};
```

**src/auth-dialog/main.ts**

This is a *standard* `PublicClientApplication` (not the nestable one) — the dialog is a real, separate browser window Office opens for you, not an iframe delegating to a hub, so plain `loginRedirect` is the right tool here.

```ts
import { PublicClientApplication, EventType, AuthenticationResult } from '@azure/msal-browser';
import { msalDialogConfig } from './msalDialogConfig';

async function run() {
  const pca = new PublicClientApplication(msalDialogConfig);
  await pca.initialize();

  const result: AuthenticationResult | null = await pca.handleRedirectPromise();

  if (result?.account) {
    // Back from Azure AD - hand the result to the task pane and let it close us
    Office.onReady(() => {
      Office.context.ui.messageParent(JSON.stringify({
        status: 'success',
        accessToken: result.accessToken,
        idToken: result.idToken,
        account: result.account,
      }));
    });
    return;
  }

  // First load, nothing to process yet - kick off interactive login
  await pca.loginRedirect({ scopes: ['User.Read'] });
}

run().catch((error) => {
  Office.onReady(() => {
    Office.context.ui.messageParent(JSON.stringify({ status: 'error', error: String(error) }));
  });
});
```

**src/taskpane/auth.ts** — NAA first, dialog only as a fallback

```ts
import { createNestablePublicClientApplication, IPublicClientApplication } from '@azure/msal-browser';

let pcaPromise: Promise<IPublicClientApplication> | null = null;

function getPca() {
  if (!pcaPromise) {
    pcaPromise = createNestablePublicClientApplication({
      auth: {
        clientId: 'YOUR_AZURE_CLIENT_ID',
        authority: 'https://login.microsoftonline.com/common',
      },
    });
  }
  return pcaPromise;
}

export async function getAccessToken(scopes: string[] = ['User.Read']): Promise<string> {
  const pca = await getPca();
  const accounts = pca.getAllAccounts();

  try {
    const result = accounts.length
      ? await pca.acquireTokenSilent({ account: accounts[0], scopes })
      : await pca.ssoSilent({ scopes });
    return result.accessToken;
  } catch (naaError) {
    console.warn('NAA unavailable/failed, falling back to dialog auth', naaError);
    return acquireTokenViaDialog();
  }
}

function acquireTokenViaDialog(): Promise<string> {
  return new Promise((resolve, reject) => {
    Office.context.ui.displayDialogAsync(
      `${window.location.origin}/auth-dialog.html`,
      { height: 60, width: 30, promptBeforeOpen: false }, // % of screen, not px
      (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(`${asyncResult.error.code}: ${asyncResult.error.message}`));
          return;
        }

        const dialog = asyncResult.value;

        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg: any) => {
          const message = JSON.parse(arg.message);
          dialog.close();
          message.status === 'success'
            ? resolve(message.accessToken)
            : reject(new Error(message.error ?? 'Authentication failed'));
        });

        dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg: any) => {
          reject(new Error(`Dialog closed (code ${arg.error})`)); // e.g. 12006 = user closed it
        });
      }
    );
  });
}
```

A few things worth flagging while you wire this up:

- **Azure App Registration**: register `https://your-domain.com/auth-dialog.html` (and your local dev https URL — Office Add-ins require https even in dev, typically via `office-addin-dev-certs`) as a redirect URI under the **SPA** platform, same as you'd have done for the old `auth-redirect.html`.
- `displayDialogAsync`'s `height`/`width` are percentages of the screen, not pixels — easy to misconfigure.
- Handle `DialogEventReceived` (not just `DialogMessageReceived`) so a user closing the dialog manually doesn't leave your promise hanging forever.
- Test with third-party cookies blocked — that's the scenario most likely to make NAA silently fail and force the dialog fallback path, so it's worth deliberately exercising rather than only discovering in production.
