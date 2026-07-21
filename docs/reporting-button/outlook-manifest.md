# Outlook Add-in Manifest

This folder contains the Outlook add-in manifest for the Minerva report-button
app. It uses the **XML "add-in-only" manifest** format (the classic Office
Add-ins manifest, as opposed to the newer [unified JSON
manifest](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/json-manifest-overview)).
Microsoft still supports and documents the XML format, and it is required for
some deployment channels, so it's what this app uses.

## Files

| File                   | Purpose                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.example.xml` | Fully commented template with `{{placeholder}}` values. Copy/adapt this for a new environment (e.g. staging, production).                                                                                                             |
| `manifest.local.xml`   | Filled-in manifest for **local development**. Points at `https://localhost:5174`, matching the port Vite serves on (`apps/report-button/vite.config.mts`). Use this to sideload the add-in into Outlook while running the dev server. |

## Encoding

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

The manifest must be saved as UTF-8. This isn't just a formality here: the
`bt:LongStrings`/`bt:ShortStrings` blocks contain non-ASCII localized text
(German, French, Portuguese, etc. via `bt:Override`), which will render
incorrectly if the file is re-saved with a different encoding.

## Section-by-section walkthrough

Line numbers below refer to `manifest.example.xml`.

### Root element and namespaces

```xml
<OfficeApp
    xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
    xsi:type="MailApp">
```

`xsi:type="MailApp"` declares this as an Outlook add-in (as opposed to
`TaskPaneApp`, `ContentApp`, etc. for other Office hosts). The `bt` namespace
(`officeappbasictypes`) is what lets the manifest declare reusable
images/URLs/strings by id later in `<Resources>`.

### Top-level identity and metadata

- `<Id>` — a GUID (UUID v4) that uniquely identifies this add-in. Must stay
  stable across versions/deployments of the *same* add-in; generate a new one
  only when creating a genuinely new add-in.
- `<Version>` — must be bumped on every deployment; Outlook/AppSource use it
  to detect updates.
- `<ProviderName>` / `<DefaultLocale>` — shown in add-in listings; locale used
  when no `bt:Override` matches the client's language.
- `<DisplayName>` / `<Description>` — the **non-localizable legacy fallback**
  shown only to very old Outlook clients that don't understand
  `<VersionOverrides>`. `DisplayName` cannot be localized in this manifest
  format at all (a known Microsoft platform limitation); `Description` *is*
  localized for modern clients via the `resid`-based override further down.
- `<IconUrl>` / `<HighResolutionIconUrl>` / `<SupportUrl>` — icon and support
  link shown in the add-in catalog/store UI.

### `<AppDomains>`

```xml
<AppDomain>https://login.microsoftonline.com</AppDomain>
<AppDomain>https://login.live.com</AppDomain>
```

Domains the add-in is allowed to navigate to/interact with outside its own
`SourceLocation`. These two are needed for the interactive sign-in popup
fallback (`acquireTokenPopup`) used when [Nested App Authentication
(NAA)](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in)
isn't available.

### `<Hosts>` and outer `<Requirements>`

```xml
<Hosts><Host Name="Mailbox" /></Hosts>
<Requirements>
  <Sets DefaultMinVersion="1.3">
    <Set Name="Mailbox" MinVersion="1.3" />
  </Sets>
</Requirements>
```

`<Hosts>` declares this add-in targets the Outlook Mailbox host. This outer
`<Requirements>` block is a **fallback gate** for clients that understand the
add-in-only manifest but not `<VersionOverrides>` at all — kept low (1.3) so
the add-in still loads (with a plain read-form pane, no ribbon button) on very
old clients. The real, feature-rich experience needs [requirement set
1.13](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/outlook/requirement-set-1.13/outlook-requirement-set-1.13),
declared again further down.

### `<FormSettings>`, `<Permissions>`, `<Rule>`

- `<FormSettings>` — `SourceLocation` (where the read-form task pane loads
  from) and minimum `RequestedHeight` in pixels, for clients that only read
  the top-level manifest.
- `<Permissions>ReadWriteMailbox</Permissions>` — the **Office.js API
  permission level**. This governs what `Office.js` calls the add-in can make
  (e.g. reading the open item's properties). It is a fixed enum
  (`RestrictedPermissions` / `ReadItem` / `ReadWriteItem` / `ReadWriteMailbox`)
  and is **separate from** the Microsoft Graph scopes declared later in
  `<WebApplicationInfo>`, which are consented to via the Entra ID app
  registration and govern Graph API calls, not Office.js calls. See [Understand
  Outlook add-in permissions](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/understanding-outlook-add-in-permissions).
- `<Rule xsi:type="RuleCollection" Mode="Or">` with a nested `ItemIs` rule —
  restricts activation to `Message` items in `Read` form only (never
  `Compose`), so the add-in never appears while composing an email.

### `<VersionOverrides>` (V1_0)

Everything from here on overrides/extends the top-level declarations for
clients that *do* understand `<VersionOverrides>`.

- `<Description resid="App.Description" />` — swaps in the localized
  description (defined in `<Resources>` below) instead of the plain
  `<Description>` from the top level.
- Nested `<Requirements>` — same MinVersion 1.3 gate, scoped to this override
  block.
- `<Hosts><Host xsi:type="MailHost"><DesktopFormFactor>` — this is where the
  actual ribbon button is wired up:
  - `<FunctionFile resid="Function.Url" />` — page used for any headless
    (`ExecuteFunction`) actions; here it just points at the app root since
    the add-in only uses `ShowTaskpane`.
  - `<ExtensionPoint xsi:type="MessageReadCommandSurface">` → `<OfficeTab>` →
    `<Group>` → `<Control xsi:type="Button">` → `<Action xsi:type="ShowTaskpane">`
    — declares a ribbon tab group with one button that opens the task pane
    (`TaskpaneId` + `SourceLocation`). `<Supertip>` is the hover tooltip
    (title + description).
  - `<SupportsSharedFolders>true</SupportsSharedFolders>` — enables the
    add-in on delegate-accessed shared folders (requirement set 1.8+).

- `<Resources>` — the shared lookup tables referenced by `resid=` attributes
  everywhere else in the manifest:
  - `bt:Images` — icon URLs at each required pixel size (16/32/80 for
    desktop ribbon, 25/48 also used on mobile).
  - `bt:Urls` — the `Function.Url` and `Taskpane.Url` referenced above.
  - `bt:ShortStrings` / `bt:LongStrings` — button/tooltip labels and
    descriptions, each with a `DefaultValue` plus `bt:Override Locale="..."`
    entries for German/French/Dutch/Spanish/Portuguese.

  These resources are defined **once** and reused by both the V1_0 block
  above and the nested V1_1 block below — no need to duplicate strings/icons
  per form factor.

### Nested `<VersionOverrides>` (V1_1)

```xml
<VersionOverrides xmlns="...mailappversionoverrides/1.1" xsi:type="VersionOverridesV1_1">
```

This inner block is what actually governs modern clients (Windows, Mac,
web/OWA, mobile) and is where the effective requirement is [Mailbox
1.13](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/outlook/requirement-set-1.13/outlook-requirement-set-1.13)
(full shared-mailbox support, superset of the 1.8 shared-folder support
declared above).

- The Desktop command surface is **redeclared** here with different element
  ids (`msgReadGroup11`, `msgReadOpenPaneButton11`) — ids must be unique
  across the whole manifest, so the 1.1 override can't reuse the V1_0 ids
  even though it's functionally the same button.
- `<MobileFormFactor>` + `<ExtensionPoint xsi:type="MobileMessageReadCommandSurface">`
  — the mobile (iOS/Android) ribbon button. Per Microsoft guidance this is
  the only extension point that should be declared for a standard read-mode
  add-in; there's no compose-mode equivalent, which keeps the add-in
  read-only on mobile automatically.

### `<WebApplicationInfo>`

```xml
<WebApplicationInfo>
  <Id>{{Graph-API-CLIENT-ID-AS-UUID}}</Id>
  <Resource>api://{{deployed-domain}}/{{Graph-API-CLIENT-ID-AS-UUID}}</Resource>
  <Scopes>...</Scopes>
</WebApplicationInfo>
```

Registers the add-in's Microsoft Entra ID app for SSO/[Nested App
Authentication](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in)
and surfaces the Microsoft Graph permissions ("scopes") it needs, so admins
can review/consent to them centrally (e.g. in the Microsoft 365 admin
center). This does **not** by itself enable NAA — that happens in code, via
`createNestablePublicClientApplication()` from `@azure/msal-browser` using
this same client id, after the app is registered in Entra with a
`brk-multihub://<your-add-in-domain>` SPA redirect URI.

Scopes declared:

| Scope                                                           | Purpose                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `openid`, `profile`, `offline_access`                           | Sign-in / basic identity, refresh tokens                                 |
| `User.Read`                                                     | Basic signed-in user profile                                             |
| `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`                      | Read/write/send mail in the signed-in user's own mailbox                 |
| `Mail.Read.Shared`, `Mail.ReadWrite.Shared`, `Mail.Send.Shared` | Same actions in shared folders/mailboxes the user has delegate access to |

This element must be the **last** child of the outer `<VersionOverrides>`.

## What to replace for a real deployment

`manifest.local.xml` already has these filled in for local dev. When creating
a manifest for a new environment (staging/production), copy
`manifest.example.xml` and replace:

| Placeholder                                  | Occurrences                                                                                    | Replace with                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{GUID}}`                                   | `<Id>` (top of file)                                                                           | A newly generated UUID v4 — unique per add-in, stable across its versions                                                                       |
| `{{deployed-domain}}`                        | `IconUrl`, `HighResolutionIconUrl`, `SourceLocation`, every `bt:Image`/`bt:Url` `DefaultValue` | Your HTTPS hosting domain for this environment (must serve valid TLS — Outlook refuses self-signed certs except via the trusted local dev cert) |
| `{{url-to-be-displayed-in-addon-interface}}` | `<SupportUrl>`                                                                                 | A real support page URL                                                                                                                         |
| `{{Graph-API-CLIENT-ID-AS-UUID}}`            | `<WebApplicationInfo><Id>` and `<Resource>`                                                    | The Entra ID app registration's Application (client) ID                                                                                         |
| `<Version>`                                  | top of file                                                                                    | Bump on every deployment                                                                                                                        |

## Microsoft documentation

- [Office Add-ins XML manifest overview](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/add-in-manifests)
- [Add-in manifest XML schema reference](https://learn.microsoft.com/en-us/javascript/api/manifest/officeapp)
- [Requirement sets in Office Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/office-versions-and-requirement-sets)
- [Outlook requirement set 1.13](https://learn.microsoft.com/en-us/javascript/api/requirement-sets/outlook/requirement-set-1.13/outlook-requirement-set-1.13)
- [Understand Outlook add-in permissions (`<Permissions>` levels)](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/understanding-outlook-add-in-permissions)
- [Microsoft Graph permissions and consent](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Enable Nested App Authentication in your add-in](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in)
- [Sideload Outlook add-ins for testing](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/sideload-outlook-add-ins-for-testing)
- [`office-addin-manifest` validate command](https://github.com/OfficeDev/Office-Addin-Scripts/tree/main/packages/office-addin-manifest#validate)

## Install locally in Outlook (sideloading)

### Mac/Windows application

1. Start the dev server from the repo root (serves `https://localhost:5174`
   with a trusted local dev certificate via `localHttps()` in
   `tools/vite/vite-shared`):
   ```sh
   npx nx run report-button:serve
   ```
2. Sideload `manifest.local.xml`:
   **Outlook on Windows/Mac (classic)**: **Home** tab → **Get Add-ins** →
     **My add-ins** → **Add a custom add-in** → **Add from file...** → select
     the same manifest.
3. Open any email in read mode — the "Minerva" ribbon button should appear.

Outlook requires the `SourceLocation`/icon URLs to be reachable over valid HTTPS, so the dev server must be running and its certificate trusted before sideloading (see the repo's `scripts/setup-certs.sh`, run as part of `npm run setup`).

### OWA (Outlook on the web)

To directly open the sideloading/add-ins dialog in Outlook on the Web (OWA), use Microsoft's official shortlink: [https://aka.ms/olksideload](https://aka.ms/olksideload)

Important Notes on How It WorksAdd from File: Modern Outlook OWA no longer supports installing directly via an HTTP/HTTPS URL path. 

You must download or save your manifest .xml file locally, select "Add from File" under Custom Add-ins, and choose the XML file.Local Storage: When sideloaded in OWA, the add-in manifest is stored in your browser's local cache. Clearing browser data or changing browsers will require re-uploading it. 

See also [Microsoft Learn](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing#:~:text=When%20you%20sideload%20an%20add%2Din%20on%20the,you%20have%20to%20sideload%20the%20add%2Din%20again.)

## Validating the manifest

The [`office-addin-manifest`](https://www.npmjs.com/package/office-addin-manifest)
CLI checks that the manifest is well-formed XML, conforms to the manifest schema, and has all required elements/attributes present.

```sh
cd apps/report-button
npm run validate:manifest
```

which runs:

```json
"validate:manifest": "npx office-addin-manifest validate manifest/manifest.local.xml"
```

Run this after any manual edit to the manifest, and before sideloading or deploying it.

