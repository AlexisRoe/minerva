# Minerva Button — implementation plan

Derived from [`implementation-guide.md`](./implementation-guide.md), which stays the statement of
intent; this file is the ordered execution plan. Steps 1–12 are meant to be worked and reviewed one
at a time.

## Context

`apps/frontend/minerva-button` is scaffolding today: config loading, i18n (8 locales), Sentry, an
error-log store, a hash router with three placeholder views, and three thin adapters
(`office`/`graph`/`minerva`) that don't do the real work. `implementation-guide.md` describes the
actual product: an Outlook read-mode task pane that boots through a gated startup sequence, lets the
user report an email as suspicious or spam, fans the report out to Graph and the Minerva backend, and
ends on a confirmation screen with a mailbox action.

Everything the UI needs already exists in `@minerva/ui-lib` (`ReportButtonPage`, `LoadingIndicator`,
`NoContentView`, `ErrorView`, `ConfirmationView`, `ButtonDrawer`, `UserFeedback`), and the wire
contracts already exist in `@minerva/typescript-lib` (`src/requests/`, `src/response/`). This plan
wires those two together and fills in the Office/Graph/auth machinery between them.

**Decisions taken (confirmed):**

- Scope is the **button only**. The `api` backend is a bare scaffold (`/health`, `/jobs`); its three
  endpoints get planned separately. Every backend call goes through an adapter with a demo
  implementation selected by the existing `config.demo` flag.
- Runtime requirement-set gate is **Mailbox 1.13**, matching `manifest/manifest.local.xml`. The
  guide's "1.14" is treated as a typo; manifests are not touched.
- Notification emails are sent **client-side via Graph `POST /me/sendMail`**, one per
  `settings.reportingMethods[]`, in parallel. This matches the `Mail.Send` scope already declared in
  `<WebApplicationInfo>`.
- NAA is primary; when `isSetSupported('NestedAppAuth', '1.1')` is false, fall back to the **Office
  Dialog API** using the existing `auth-dialog.html` page.

---

## Contract fixes first (blocking) ✅ done

`shared/typescript-lib/src/requests/` and `src/response/` are written and built but **not exported
from `src/index.ts`** — the lib has a single root export and no subpaths, so the button cannot import
them at all today. Before anything else:

1. Add the six files to `shared/typescript-lib/src/index.ts`.
2. Rename `minerva-button.settings.request.ts` → `minerva-button-settings.request.ts` for
   consistency with its siblings.
3. `ReportingFormData.file` is typed `Buffer` — a Node type that will not typecheck in the browser
   bundle and is the wrong shape for a multipart upload. Change to `Blob`. Fix the `message/rfc82`
   typo in its JSDoc to `message/rfc822`.
4. `MinervaButtonSettings` has no `userFeedback` field, so the declared `UserFeedback` /
   `ReportingReasons` types are unreachable from the response root and the report drawer has no
   reasons to render. Add `userFeedback: UserFeedback` to `MinervaButtonSettings`.
5. `ReportingFormData.userLanguage` stays a raw `string` — it carries the **BCP-47 language tag**
   from Office.js (`en-US`), not the internal `Languages` enum, and the backend needs the full tag.
   Only the JSDoc changes, to say so unambiguously: `/** BCP-47 language tag as reported by
   Office.js (e.g. "en-US") — the full tag, not the internal Languages enum */`. This is deliberately
   different from `MinervaSettingsRequest.userLanguage`, which is `Languages` because it selects a
   catalogue.
6. `make build-libs` after — consumers resolve `shared/**` through gitignored `dist/`.

Naming clash to keep in mind: `UserFeedback` is both a settings type in typescript-lib and a
component in ui-lib. Import the type as `import type { UserFeedback as UserFeedbackSettings }` at the
call sites that need both.

### Outcome

All six done as written, and `make build-libs` is green. The button now imports every contract from
the `@minerva/typescript-lib` root.

One thing worth recording: the root index is the *only* export surface, so the six type names now
share a namespace with everything else the lib exports. `UserFeedback` is the one collision waiting
to happen (the ui-lib component of the same name), which is why the alias note above stays.

---

## Step 1 — Office.js and the environment gate ✅ done

**Files:** `index.html`, `src/adapters/office/utils/wait-for-office.util.ts`,
`.../read-environment.util.ts`, `src/errors/office.errors.ts`

- Add to `index.html` `<head>`, before the module script:
  `<script defer src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>`
  (`auth-dialog.html` already loads it the same way.) `defer` is required — Office.js must be the
  first script to run against the DOM but must not block the boot splash.
- `waitForOffice(timeoutMs = 5000)`: race `Office.onReady()` against a timer. `Office` may be
  `undefined` entirely if the CDN is blocked, so guard `typeof Office === 'undefined'` before
  touching it. Reject with `OfficeLoadTimeoutError`.
- `readEnvironment()` returns `{ host, platform, requirementSetSupported, naaSupported }` from:
  - `Office.context.mailbox === undefined` → not Outlook → `OfficeHostUnsupportedError`
  - `Office.context.requirements.isSetSupported('Mailbox', '1.13')` → else
    `OfficeRequirementSetError`
  - `Office.context.requirements.isSetSupported('NestedAppAuth', '1.1')` → drives the auth fallback
    in Step 4, not an error
  - `Office.context.diagnostics.platform` / `.host`, `Office.context.mailbox.diagnostics`

Docs: [Initialize your add-in](https://learn.microsoft.com/en-us/office/dev/office-js/initialize-add-in),
[Outlook requirement sets](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/outlook/outlook-api-requirement-sets),
[NestedAppAuth requirement set](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/common/nested-app-auth-requirement-sets).

Each failure gets its own `MinervaError` subclass so the loader can map code → i18n message. **Next
free code is `ERR_007`** — reserve new ones in `src/errors/errors.registry.ts`, never reuse or
renumber (codes double as i18n keys and Sentry fingerprints).

### Outcome

Shipped as planned. `make verify` green (lint → typecheck → 626 tests, 11 new).

- `src/errors/office.errors.ts` — `ERR_007` `OfficeLoadTimeoutError`, `ERR_008`
  `OfficeHostUnsupportedError`, `ERR_009` `OfficeRequirementSetError`, all `logLevel: 'warn'` since
  each is a condition a user can meet through no fault of the deployment. Registered in
  `errors.registry.ts` and re-exported from `src/errors/index.ts`. **Next free code is now `ERR_010`.**
- `waitForOffice(timeoutMs = 5000)` waits out *two* failures against one deadline — the global never
  being installed (blocked CDN) and `Office.onReady()` never resolving. The first is a poll loop
  rather than a single `typeof` check: the deferred script is ordered ahead of the bundle so the
  global is there on the first poll in practice, but a change to that ordering then degrades into a
  wait instead of an immediate false negative.
- `readEnvironment(info)` decides Outlook on the presence of `Office.context.mailbox`, checks
  `isSetSupported('Mailbox', '1.13')`, and returns `naaSupported` from
  `isSetSupported('NestedAppAuth', '1.1')` without ever failing on it.
- `index.html` carries the Office.js CDN tag with `defer`.

**One thing found that the plan did not anticipate.** `@types/office-js@1.0.604` declares
`Office.onReady()`'s result shape *inline on the signature*, exporting no name for it, and types
both fields non-nullably even though outside an Office host they arrive as `null` — the very case
the gate exists to catch.

So `OfficeReadyInfo` is **derived from the installed types**, not transcribed:

```ts
type OfficeOnReadyResult = Awaited<ReturnType<typeof Office.onReady>>;

export type OfficeReadyInfo = {
  readonly [Key in keyof OfficeOnReadyResult]: OfficeOnReadyResult[Key] | null;
};
```

Field names and enum types stay tied to `@types/office-js`, so an Office.js API change becomes a
compile error here; the only thing added is `| null`. `waitForOffice` then returns Office's own
result by plain widening, with no assertion at all.

Separately: `Office.HostType` / `Office.PlatformType` are declared as **numeric** enums while
Office.js assigns them strings (`'Outlook'`, `'OfficeOnline'`). Comparing against the enum
(`info.host === Office.HostType.Outlook`) is correct and is Microsoft's documented pattern — both
sides read the same runtime object. What does *not* typecheck is using either value as a `string`,
which is why `readEnvironment` renders them through a local `label()` before recording them.

## Step 2 — Read the message and the office store ✅ done

**Files:** `src/adapters/office/utils/read-current-message.util.ts` (extend),
`src/store/office/office.store.ts`

Extend the existing `readCurrentMessage()` — it already narrows `Office.context.mailbox.item` — to
also capture what the reporting request needs: `internetMessageId`, `dateTimeCreated` →
`deliveredAt`, and the REST id via
`Office.context.mailbox.convertToRestId(item.itemId, Office.MailboxEnums.RestVersion.v2_0)` →
`exchangeId`. `item.itemId` is an EWS id and **cannot be passed to Graph unconverted**.

`useOfficeStore` (zustand, not persisted) holds `{ environment, message, user, host }`, where `user`
comes from `Office.context.mailbox.userProfile`. Keep **both** language forms: the raw
`Office.context.displayLanguage` BCP-47 tag (goes into `ReportingFormData.userLanguage` verbatim) and
the internal `Languages` value derived via `convertMicrosoftLanguagetoInternalLanguage` (already in
typescript-lib) for i18n and `MinervaSettingsRequest`.

Docs: [convertToRestId](https://learn.microsoft.com/en-us/javascript/api/outlook/office.mailbox#outlook-office-mailbox-converttorestid-member(1)),
[Use the Outlook REST APIs from an add-in](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/use-rest-api).

### Outcome

Shipped, with two deliberate departures from the plan. `make verify` green (639 tests, 13 new).

- `OutlookMessage` gained `exchangeId` (the converted REST id) and `internetMessageId`.
  `readCurrentMessage()` converts the id **once, at the adapter boundary**, and carries both forms —
  converting per call site is how one of them eventually gets missed.
- **Departure 1: no separate `deliveredAt` field.** The plan had `dateTimeCreated` → `deliveredAt`,
  but `OutlookMessage.receivedAt` already *is* `dateTimeCreated.toISOString()`. Two fields holding
  the same value invite drift, so the rename happens at the reporting-request boundary in Step 8
  instead: `deliveredAt: message.receivedAt`.
- **Departure 2: the user is read by its own util,** `readCurrentUser()` → `OutlookUser`, rather
  than being folded into the message reader. They are independent — a pane can have a mailbox owner
  and no open message — and one function returning two unrelated nullable things would have made the
  null cases ambiguous.
- **Departure 3: both readers are synchronous and throw instead of awaiting `Office.onReady()`.**
  The start-up gate has already awaited `waitForOffice()` by the time either runs, so awaiting again
  only masked the one case that matters — being called *without* the gate. That is now `ERR_010`
  `OfficeNotReadyError` (fatal, like `ConfigProviderMissingError`: no user action fixes it).
  **Next free code is now `ERR_011`.**

  The two outcomes stay distinct: no mailbox is a wiring fault and throws; no *item* is ordinary
  — the pane can be open on a non-message — and still answers `null`. Previously both collapsed
  into `null` and read as "no message open".

  `readCurrentUser()` has no null outcome at all: a mailbox always has an owner, so an absent
  `userProfile` is the same wiring fault.

  Consequence: `useCurrentMessage()` now owns the waiting the reader gave up — it awaits
  `waitForOffice()` itself, so a component outside the gate still works. Its JSDoc now points at
  `useOffice()` as the preferred read once the loader has run, since the message is in the store by
  then.
- `OutlookUser` keeps both language forms as the contract fix decided: `displayLanguage` as the
  verbatim BCP-47 tag for `ReportingFormData`, and `language` reduced via
  `convertMicrosoftLanguagetoInternalLanguage` for the catalogues. A test pins `en-GB` → tag kept,
  `Languages.English` derived.
- `useOfficeStore` + `useOffice()` under `src/store/office/`. Not persisted, unlike the error log:
  it is one pane session, and half of it is mailbox content that has no business in `localStorage`.
  One write (`setOffice`), because nothing the host reports changes while a pane is open.

Three existing fixtures needed the two new `OutlookMessage` fields
(`use-current-message.hook.test.ts`, `message-summary.component.test.tsx`,
`task-pane.view.test.tsx`) — mechanical, no behaviour changed.

## Step 3 — Adapter seam and demo data ✅ done

**Files:** `src/adapters/minerva/*`, `src/adapters/graph/*`, `src/demo/*`

Define one interface per backend call and one per Graph call, then two implementations each: `http`
and `demo`. A single `createAdapters(config: AppConfig)` returns the demo set when `config.demo` is
true. `loadConfig` already computes `demo` from `allowDemo && ?demo=true`, so demo mode needs no new
plumbing.

Calls to define:

| Adapter | Call | Request → Response |
| --- | --- | --- |
| minerva | `authorize` | `AuthorizationRequest` → `AuthorizationResult` |
| minerva | `getSettings` | `MinervaSettingsRequest` → `MinervaButtonSettings` |
| minerva | `submitReport` | `ReportingFormData` (multipart) → `ReportingResponse` |
| graph | `getMimeMessage` | `exchangeId` → `Blob` |
| graph | `sendMail` | message + method → void |
| graph | `moveMessage` | `exchangeId`, destination → void |

All HTTP calls go through one `request()` helper that sends `credentials: 'include'` (the session
cookie is httpOnly and set by the backend) and converts non-2xx into `MinervaError` subclasses. The
existing `submitWorkItem()` throws a bare `Error`, which violates the repo rule — **delete
`src/adapters/minerva/utils/submit-work-item.util.ts`, its hook, its tests, and `WorkItemDraft` /
`WorkItemReceipt`**; they target `/api/work-items`, an endpoint that does not exist.

Demo fixtures live in `src/demo/` and cover: an Outlook environment, a message, an
`AuthorizationResult`, a `MinervaButtonSettings` exercising every toggle (two reporting methods,
mandatory reasons, contact block filled), a MIME blob, and a `ReportingResponse` for each
`identifiedAs` value. `configFixture` is the model for how these are written.

### Outcome

Built as planned. `MinervaAdapter` and `GraphAdapter` each have an `http` and a `demo`
implementation, `createAdapters(config, getAccessToken)` picks a set, and `request()` is the only
place either adapter touches `fetch`. The work-item and message-body code is gone. `make verify` is
green: 680 tests across 91 files.

**Two new error codes. Next free code is `ERR_013`.**

- `ERR_011` `MinervaRequestFailedError` — reference `062700dc-07d8-4f83-a247-4675423e1b8a`
- `ERR_012` `GraphRequestFailedError` — reference `21824843-60bf-49be-9d02-59e19360ebab`

One code per *service* rather than per call or per status, so an `ERR_011` spike routes to us and an
`ERR_012` spike routes to the tenant without anyone reading the payload. Status and path travel in
the payload, which keeps the message constant and stops the Sentry fingerprint splitting per URL.

### Departures from the plan

1. **`createAdapters` takes a second argument.** The plan wrote it as `createAdapters(config)`, but
   Graph needs a bearer token and this folder must not import `src/auth/` — which of the two sign-in
   flows won is not Graph's business. So the signature is
   `createAdapters(config, getAccessToken: AccessTokenProvider)`. The token is resolved *per call*
   rather than captured once: a pane can sit open far longer than a token lives.

2. **`sendMail` takes a `NotificationMail`, not "message + method".** Templating is Step 8's job and
   Graph's wire format is this folder's, so the seam carries a plain
   `{ to, subject, bodyHtml, headers, attachment? }`. Everything Graph-specific — `saveToSentItems`,
   the `@odata.type` discriminator, base64-encoding the attachment, the `internetMessageHeaders`
   array shape — lives on the far side of it.

3. **The demo Graph adapter records rather than returning bare voids.**
   `createGraphDemoAdapter()` returns `{ adapter, sentMail, movedMessages }`. Its two write calls
   have real side effects — mail landing in front of a security team, a message leaving a mailbox —
   so demo mode is not a convenience here but the thing that keeps a walkthrough from filing real
   reports; the record makes that assertable.

4. **`TaskPaneView` was unwired, not deleted.** It imported the deleted `useSubmitWorkItem`. Since
   Step 7 replaces it outright with the report view, it now only navigates, and its test lost the two
   submit cases. Not worth building a bridge to code that is about to go.

5. **Attachments are base64-encoded via `FileReader`, not `btoa(await blob.text())`.** MIME is bytes.
   Reading it as text decodes it as UTF-8 first and corrupts every byte above 0x7F — which any
   non-ASCII subject in the reported mail will contain. `encodeAttachment()` has a round-trip test
   for exactly this.

### Verified

`make verify` green. Two assertions were mutation-tested and both failed correctly when the code was
broken: putting `credentials: 'include'` *before* the `...init` spread (so a caller could opt out),
and dropping the `.slice(0, MAX_CUSTOM_HEADERS)` cap on the Graph headers.

## Step 4 — Authentication ✅ done

**Files:** `src/auth/naa.util.ts`, `src/auth/dialog.util.ts`, `src/auth/acquire-token.util.ts`,
`src/auth-dialog/main.ts` (rewrite)

Add `@azure/msal-browser` via `pnpm add` (never hand-write a version; it goes in the
`pnpm-workspace.yaml` catalog per `catalogMode: strict`).

**Primary — NAA.** Per Microsoft's Outlook tab in the NAA guide:

```ts
msalInstance = await createNestablePublicClientApplication({
  auth: { clientId, authority: 'https://login.microsoftonline.com/common' },
  cache: { cacheLocation: 'localStorage' },
});
// then acquireTokenSilent(request) → on InteractionRequiredAuthError → acquireTokenPopup(request)
```

Scopes: `['User.Read', 'Mail.Read', 'Mail.ReadWrite', 'Mail.Send']`, widened to the `.Shared`
variants when `Office.context.mailbox.item` is in a shared/delegate mailbox. The request must include
at least one scope beyond `openid`/`profile`/`email`/`offline_access` or it fails.

`clientId` must become runtime config, not a constant — add `APP_FE_RB_ENTRA_CLIENT_ID` to
`config.entries.ts` and `RuntimeConfig`/`isRuntimeConfig` in `src/config/config.types.ts`. Local value
is the `<WebApplicationInfo><Id>` from `manifest.local.xml`:
`E81D4C4B-767E-4F5B-865F-87F816C0C953`. Entra also needs an SPA redirect
`brk-multihub://localhost:4101` — a deployment prerequisite, not a code change.

**Fallback — Office Dialog API.** When `naaSupported` is false, `Office.context.ui.displayDialogAsync`
opens `/auth-dialog`, which runs a plain MSAL redirect flow and returns the token via
`Office.context.ui.messageParent`. `auth-dialog.html` and the Vite `extraPages` entry already exist;
`src/auth-dialog/main.ts` currently hand-declares an `OfficeGlobal` interface even though
`@types/office-js` is a devDependency and is in `tsconfig.json` `types` — drop the hand-rolled
interface while rewriting.

**Then:** POST the Graph token as `AuthorizationRequest` to the backend, which validates it against
Microsoft and sets the 1h httpOnly cookie. Store `AuthorizationResult` in `useSessionStore`.

Docs: [Enable SSO with nested app authentication](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in),
[Authenticate with the Office dialog API](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/auth-with-office-dialog-api),
[MSAL browser](https://www.npmjs.com/package/@azure/msal-browser).

Note the NAA API restrictions: `acquireTokenRedirect`, `logout*`, `handleRedirectPromise` and
`setActiveAccount` all throw or no-op under NAA. Only `acquireTokenSilent`, `acquireTokenPopup`,
`ssoSilent`, `loginPopup` and the account getters are usable.

### Outcome

Built. `@azure/msal-browser` installed via `pnpm add`, which put `5.17.3` in the workspace catalog by
itself (`catalogMode: strict`). `acquireToken(clientId, environment, sharedMailbox?)` is the only
entry point; `naa.util.ts` and `dialog.util.ts` sit behind it. `APP_FE_RB_ENTRA_CLIENT_ID` is wired
through `config.entries.ts`, `RuntimeConfig`, `isRuntimeConfig`, `configFixture` and `.env.template`.
`make verify` green: 701 tests across 94 files.

The NAA factory was checked against the installed declarations rather than assumed — v5 does export
`createNestablePublicClientApplication`, with the signature the plan expected.

**Three new error codes. Next free code is `ERR_016`.**

- `ERR_013` `AuthClientIdMissingError` (`fatal`) — reference `c835513f-9b6d-4cf0-9a3c-fb840b4c81dd`
- `ERR_014` `TokenAcquisitionFailedError` — reference `f8512657-968b-414b-8fac-142a8c175676`
- `ERR_015` `AuthDialogFailedError` — reference `c8dc444c-ee53-4bda-87e6-28dd03f0f22b`

Kept apart because different people fix them: a missing client id is a deployment rolled out
incomplete, a refused token is a tenant's consent or conditional-access policy, a failed dialog is
usually the user closing a window. `ERR_014` carries the sub-flow (`naa-init` / `naa-silent` /
`naa-popup`) in its payload rather than splitting into three codes.

### Departures from the plan

1. **The dialog page runs a redirect flow, not a popup.** A popup opened from inside an Office dialog
   is a second nested window, which several Outlook clients block outright. `main.ts` therefore uses
   `handleRedirectPromise()` → `acquireTokenRedirect()`. Note this does *not* contradict the NAA
   restrictions noted above: the dialog is a real top-level window, not a nested app, so the
   restricted APIs are exactly the ones that work there.

2. **The dialog promise settles on `DialogEventReceived` too.** The plan only described the
   `messageParent` path. Without the event handler a user who closes the window leaves the pane
   waiting for ever on a message that will never arrive — `12006` is that case, and it is ordinary
   rather than exceptional.

3. **A failed dialog reports in-band, as `{ status: 'failure', reason }`.** Nothing can be thrown
   across a document boundary, and `messageParent` carries one string, so the failure has to travel
   as data. `DialogMessage` is the shared shape; the pane also tolerates a payload that is not JSON
   at all, since an error page served in place of the dialog arrives as HTML.

4. **MSAL clients are memoised per client id.** Initialising twice in one document gives two token
   caches that cannot see each other, which shows up as a user being re-prompted moments after
   signing in. A construction *failure* is evicted rather than cached, so the next attempt retries.
   `resetNaaClients()` exists for tests only.

5. **The client id reaches the dialog through the query string.** Office opens that page as a bare
   URL, so it never boots the app's configuration loader and cannot read `config.json`.

### Verified

`make verify` green. Two assertions mutation-tested, both failed correctly when broken: removing the
`instanceof InteractionRequiredAuthError` guard (so every silent failure would raise a prompt the
user cannot act on), and ignoring `environment.naaSupported` (so an old client would never reach the
dialog fallback).

### Still a deployment prerequisite

Entra registration `E81D4C4B-767E-4F5B-865F-87F816C0C953` needs the SPA redirect
`brk-multihub://localhost:4101`, and `APP_FE_RB_ENTRA_CLIENT_ID` has to be set in the root `.env`.
Neither is a code change, and sign-in cannot be exercised in a real client until both are done.

## Step 5 — Stores ✅ done

**Files:** `src/store/office/`, `src/store/session/`, `src/store/settings/`

Three plain (non-persisted) zustand stores following the shape of the existing
`src/store/error-log/error-log.store.ts` — a store file, a types file, and a read hook under
`hooks/`. Only `error-log` uses `persist`; session and office data must not outlive the pane.
`useSettingsStore` also exposes derived selectors the views need: `canReportSpam`
(`features.enableSpamReporting`), `hasContact` (`contact.enable`), `reasonsFor(variant)`.

### Outcome

`session` and `settings` built; `office` already existed from Step 2. All three non-persisted, all
three shaped like `error-log` (store, types, read hook under `hooks/`). Exported from
`src/store/index.ts`. `make verify` green: 721 tests across 98 files. No new error codes — **next
free is still `ERR_016`.**

The derived selectors went further than the three the plan named, because the `null`-before-loaded
case is the same problem at every call site. `useSettings()` answers `isEnabled`, `canShowDetails`,
`canReportSpam`, `hasContact`, `contact`, `reportingMethods`, `isReasonMandatory`,
`hasFreetextField` and `reasonsFor(variant)` — every flag `false` and every list empty until the
settings land. That default is the safe direction: a pane that briefly showed nothing is
recoverable, one that briefly offered a button the tenant disabled is not.

### Notes

1. **The session store holds no token, of either kind.** The pane's own session is an httpOnly
   cookie `request()` sends automatically and JavaScript cannot read; Graph tokens belong to MSAL,
   which knows when they expire and this store would not. A copy here would be a credential going
   stale in silence. There is a test asserting the serialised state contains no `token` at all.

2. **`hasContact` is not `contact.enable`.** The contact block carries an address and a person even
   when disabled, so `useSettings()` returns `contact: null` rather than the object — otherwise the
   confirmation screen renders a block the tenant switched off.

3. **`reasonsFor(variant)` ignores its argument, deliberately.** The contract carries one list, not
   one per variant. The parameter is taken anyway because both drawers ask for their own reasons,
   so the day the backend splits the list this changes here and nowhere else.

4. **`useSettings` has two empty-array constants, not one.** They are module-level so a component
   reading one twice is not re-rendered by a fresh array identity, and separate so each keeps its
   element type — sharing one `[]` failed typecheck, which was the right complaint.

### Verified

`make verify` green. Two selectors mutation-tested, both failed correctly when broken: returning the
contact block regardless of `enable`, and ignoring the master `userFeedback.enabled` switch so the
reasons underneath a disabled drawer leaked out.

## Step 6 — Router loaders and the boot sequence ✅ done

**Files:** `src/routing/router.tsx`, `src/routing/routes.ts`,
`src/routing/loaders/report.loader.ts`

Routes become:

```
/                    PaneLayout  (errorElement: <RouteErrorView/>)
  index              ReportView       loader: reportLoader
  /reporting         (action target)  action: reportAction
  /confirmation      ConfirmationView loader: confirmationLoader
  /unsupported       NoContentView
  /error             ErrorView
```

`reportLoader` runs the guide's sequence in order: `waitForOffice(5000)` → `readEnvironment()` →
fill office store → authenticate → fill session store → `getSettings()` → fill settings store. On
`OfficeLoadTimeoutError` / `OfficeHostUnsupportedError` / `OfficeRequirementSetError` it
`redirect('/unsupported?reason=<code>')` rather than throwing, so the user sees `NoContentView` with a
specific message. Any other failure throws and is caught by `errorElement`.

`PaneLayout` already renders a `<Loader>` while `useNavigation().state !== 'idle'` — replace that with
the steps reel:

```tsx
<LoadingIndicator steps={mixLanguages(InitialLoadingData)} />
```

`src/constants/initial-loading.constants.ts` and `reporting-loading.constants.ts` are already written
(6 index-aligned steps × 8 languages) and currently unused; `mixLanguages` and `LoadingIndicator` come
from `@minerva/ui-lib`. Which set is shown depends on the pending route, so `PaneLayout` picks via
`useNavigation().location.pathname`.

The router is `createHashRouter` so `?retry` / `?demo` survive navigation — keep it.

Docs: [React Router loaders](https://reactrouter.com/start/data/route-object#loader),
[actions](https://reactrouter.com/start/data/route-object#action).

### Outcome

The boot sequence runs. `createReportLoader(config)` walks it in order — wait for Office.js, check
host and requirement set, read message and user, sign in, trade the token for a session, fetch
settings — writing each result to its store as it lands. `PaneLayout` shows the steps reel, picked
by the pending route. `/unsupported` exists as its own screen. `make verify`, `make verify-i18n`
both green: 741 tests across 100 files. No new error codes — **next free is still `ERR_016`.**

### Departures from the plan

1. **`routes` became `createRoutes(config)`, and `createRouter()` became `createRouter(config)`.** A
   loader runs outside React and cannot call `useConfig()`, so the configuration has to be closed
   over when the tree is built. `App` now reads it from the provider and builds the router in
   `useState(() => …)` rather than `useMemo` — `useMemo` is a hint React may discard, and rebuilding
   the router would lose the pane's history and re-run the whole boot sequence.

2. **Demo mode skips the Office layer in the loader, rather than gaining a fake Office adapter.**
   The plan's verification notes suggested making `createAdapters` return a stubbed Office reader.
   Doing it in the loader is less machinery for the same result: `config.demo` selects the office
   fixtures directly, and no token is ever requested. A fourth adapter would exist only to be
   bypassed.

3. **The unsupported screen is keyed by error code, not by a reason vocabulary of its own.** A
   redirect cannot carry a `MinervaError`, so `?reason=ERR_008` is the whole payload. The codes are
   already unique, already permanent and already what a support call quotes. An unknown code falls
   back to a generic line, so adding an error can never produce a blank screen.

4. **The i18n keys for this screen were translated now, not deferred to Step 11.** `verify-i18n` runs
   in CI, and English-only keys would have left it red between steps. Five keys × seven languages,
   done through the `translate` skill's check-fill-recheck loop; all 7 catalogues report complete.

5. **`App.test.tsx` stubs the loader.** The index route now runs the entire start-up sequence before
   it renders, which wants a host, a token and a backend. That test's subject is the wiring above the
   router; the sequence has its own tests.

### Verified

`make verify` and `make verify-i18n` both green. Two decisions mutation-tested, both failed
correctly when broken: removing the `UNSUPPORTED_CODES` split (so an old Outlook would get a stack
trace instead of an explanation), and ignoring the destination when picking the reel (so the pane
would narrate a start-up during a report).

## Step 7 — The report view

**Files:** `src/views/report/report.view.tsx`

**Do not port or copy `report-page.example.tsx`.** `*.example.tsx` files are Storybook
visualisation fixtures, never exported and never a source to copy from. Read it to see which
components compose and in what order, then build the view here from scratch, importing each component
from `@minerva/ui-lib`:

```ts
import {
  ReportButtonPage, PageDescription, ReportButtonList, ReportButton,
  SateliteButton, ButtonDrawer, ButtonInfoContent, UserFeedback, BrandLogo,
  type ReportButtonVariant, type UserFeedbackValue,
} from '@minerva/ui-lib';
```

Composition: `ReportButtonPage.Header` holds `BrandLogo` + `SateliteButton`;
`.Content` holds `PageDescription` + `ReportButtonList` with one `ReportButton` per available
variant; two `ButtonDrawer`s sit alongside — one for email details, one for the report form.

What this view owns beyond the example's hard-coded fixtures: strings come from `useTranslations()`;
reasons, mandatory-ness, the free-text toggle and whether the spam button renders at all come from
`useSettingsStore`; the info drawer's `ButtonInfoContent sections` are built from the office store and
rendered only when `features.enableEmailDetails`.

Submitting the drawer form submits a router `action` with `{ variant, reasons, comment }`, which
navigates to the reporting flow — that's what puts the steps loader on screen for free.

Two structural details the drawers require: the pane needs a `useState<HTMLDivElement | null>`
container passed as `ButtonDrawer`'s `container` prop so both drawers portal inside the task pane
rather than the document, and that container element needs `position: relative` and a height.

## Step 8 — The reporting action

**Files:** `src/routing/actions/report.action.ts`, `src/reporting/*`

In order:

1. `graph.getMimeMessage(exchangeId)` → `GET /me/messages/{id}/$value` returns the raw MIME as
   `Blob` (`message/rfc822`).
2. `minerva.submitReport(...)` — multipart `ReportingFormData` with the blob, selected reasons,
   comment, `timeZone` (`Intl.DateTimeFormat().resolvedOptions().timeZone`), `userLanguage`,
   `reportedAs`, `deliveredAt`, `exchangeId`. Returns `ReportingResponse` with the `reportId`.
3. Build the notification message from a template in `src/reporting/email-template.ts`: subject is
   `${method.subjectPrefix}${originalSubject}`, the MIME blob is attached as an `.eml` when
   `method.attachOriginalEmail`, and two custom headers mark provenance —
   `X-Minerva-Reported-By: minerva-button` and `X-Minerva-Report-Id: ${reportId}`. Graph carries these
   as `internetMessageHeaders`, which **must be `X-`-prefixed** and is capped at 5 headers.
4. `Promise.allSettled` over `settings.reportingMethods` calling `graph.sendMail(...)`. Partial
   failure is reported on the confirmation screen, not treated as total failure — the report is
   already filed at that point.
5. `redirect('/confirmation')` carrying the `ReportingResponse` plus per-method outcomes.

Docs: [Get MIME content of a message](https://learn.microsoft.com/en-us/graph/outlook-get-mime-message),
[user: sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail),
[internetMessageHeaders](https://learn.microsoft.com/en-us/graph/api/resources/internetmessageheader).

## Step 9 — The confirmation view

**Files:** `src/views/confirmation/confirmation.view.tsx`

Built here from scratch, not copied from `confirmation-page.example.tsx`. Import
`ConfirmationView` and `ReportButtonPage` from `@minerva/ui-lib`. `ConfirmationView` takes `title`,
`description`, `statusMessage`, `detailsTitle`, `details: string[]` — sections are omitted when their
prop is absent, so the work is deciding what to pass:

- title/description keyed on `reportedAs` and `identifiedAs`
  (`'system' | 'simulation' | 'unknown'`); when `isIdentified` is true, say what the email was.
- `details` lists which methods were notified plus any that failed.
- Contact section rendered only when `settings.contact.enable`, from `contactPerson`, `emailAdress`
  (note: misspelled in the contract; leave it, it's the wire name), `informationUrl`.

Footer buttons in `ReportButtonPage.Footer`, per `reportedAs`:
suspicious → **Delete** (`graph.moveMessage` to `deleteditems`) then close;
spam → **Move to Spam** (`junkemail`) then close. Close is
`Office.context.ui.closeContainer()` (Mailbox 1.5+, safely under the 1.13 gate). Use Graph
`POST /me/messages/{id}/move` with `{"destinationId": "deleteditems"}` — well-known folder names are
accepted in place of ids.

Docs: [message: move](https://learn.microsoft.com/en-us/graph/api/message-move),
[mailFolder well-known names](https://learn.microsoft.com/en-us/graph/api/resources/mailfolder),
[closeContainer](https://learn.microsoft.com/en-us/javascript/api/office/office.ui#office-office-ui-closecontainer-member(1)).

## Step 10 — Error boundary

**Files:** `src/sentry/minerva-error-boundary.component.tsx`, `src/views/error/error.view.tsx`

`src/sentry/error-boundary.tsx` currently just re-exports `Sentry.ErrorBoundary`, which cannot branch
on error type. Write a real React class component with `getDerivedStateFromError` +
`componentDidCatch`, and in `componentDidCatch` call the existing `captureError(error)` — it already
does the Minerva-vs-plain branching (level from `logLevel`, tags `code`/`reference`, `extra` from
`payload`, fingerprint `[code, reference]`) and writes to the error-log store.

Sentry's React integration does **not** auto-capture render errors without a boundary, so the manual
`captureError` call is required, and it must not be doubled up by also nesting
`Sentry.ErrorBoundary`.

Render `ErrorView` with branching:
- `MinervaError` → message from `errors.registry.ts` via `error.code`, i18n tip keyed on the code,
  `errorCode={error.code}` and `errorId={error.reference}`.
- anything else → generic i18n message, no code shown.
- Retry button (`buttonLabel` + `buttonAction` — ui-lib draws the button only when both are given)
  reloads with the `retry` param incremented; `loadConfig` already clamps it to `MAX_RETRY = 1`, so
  the second failure shows no retry.

The router's `errorElement` needs the same treatment via `useRouteError()`, since loader/action
rejections never reach a boundary.

## Step 11 — i18n

**Files:** `src/i18n/locales/*.json` (all 8)

`en.json` has 13 keys today; this adds roughly 40 — report page copy, drawer labels, the four
unsupported-environment reasons, per-`identifiedAs` confirmation copy, contact section, footer
buttons, and one message + tip per new `ERR_xxx`. Add to `en.json` first, then run the `translate`
skill to fill the other seven and `make verify-i18n` to check for missing/stale/unknown keys.

The loading-step strings are **not** in the i18n catalogues — they live in `src/constants/` by
design, because `mixLanguages` deliberately shows a different language per step.

## Step 12 — Tests

Every method gets a sibling `*.test.ts(x)`. Follow the established patterns:

- Utils/adapters: `vi.stubGlobal('fetch', vi.fn())` with partial `Response` objects,
  `vi.unstubAllGlobals()` in `afterEach` — see `src/config/utils/load-config.util.test.ts`. No msw.
- `Office`: `vi.stubGlobal('Office', ...)` with a minimal fake exposing `onReady`,
  `context.mailbox.item`, `context.requirements.isSetSupported`, `context.ui`. Add a
  `src/test/office.fixture.ts` builder so each test tweaks one field. `App.test.tsx` currently
  `vi.mock`s the whole office adapter away — that stays valid for view tests.
- Routing: `createMemoryRouter` + `RouterProvider` inside `MinervaThemeProvider`, per
  `src/routing/layout/pane-layout.component.test.tsx` (the hash router leaks global location in
  jsdom).
- Errors: `rejects.toMatchObject({ code: 'ERR_007', payload: {...} })` alongside `toBeInstanceOf`.

Cover at minimum: the 5s Office timeout, each environment-gate rejection, NAA silent → popup
fallback, NAA-unsupported → dialog fallback, `reportLoader` happy path and each redirect, the report
action's partial `sendMail` failure, and the boundary's Minerva-vs-plain branching.

---

## Verification

```sh
make build-libs          # required — the button resolves typescript-lib through gitignored dist/
make verify              # lint → typecheck → test
make verify-i18n         # catalogues valid, no missing/stale/unknown keys
```

Then end-to-end, in three passes:

1. **Demo mode, browser.** `make dev-button`, open
   `https://localhost:4101/?demo=true` (needs `APP_FE_RB_ALLOW_DEMO=true` in the root `.env`). Office.js
   will not be ready outside Outlook, so this exercises the `/unsupported` path — confirm the message
   is specific, not generic. To exercise the full flow in the browser, the demo adapter set must also
   stub the Office layer; make `createAdapters` return a fake Office reader under `demo`.
2. **Storybook.** `make storybook` at https://localhost:4301 — `MinervaButton/Views/*` still render;
   the button app should not need new ui-lib components. If it does, that's a signal the composition
   drifted from the example.
3. **Real Outlook.** Sideload `manifest/manifest.local.xml` (Outlook → Get Add-ins → My add-ins → Add
   from file; OWA via https://aka.ms/olksideload). Requires the trusted local cert from
   `scripts/setup-certs.sh` and the Entra `brk-multihub://localhost:4101` redirect. Open a message in
   read mode, walk the full path: steps loader → sign-in → report page → drawer → reporting loader →
   confirmation → Move to Spam. Verify in the target mailbox that the notification mail carries
   `X-Minerva-Report-Id` and the `.eml` attachment.

## Deployment prerequisites (not code)

- Entra app registration `E81D4C4B-...`: SPA redirect `brk-multihub://localhost:4101`, and one per
  deployed origin.
- `APP_FE_RB_ENTRA_CLIENT_ID` in the root `.env`.
- The three backend endpoints — planned separately; until they exist only demo mode runs end to end.
