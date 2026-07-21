Good question — there are effectively three tiers of language detection, each available at a different point in the load sequence, and the trick is falling back gracefully as better data arrives.

## 1. Before any code runs — manifest-level locale
This is actually the *earliest* possible mechanism, but it's static, not runtime detection. In the manifest you can register locale-specific overrides for `SourceLocation`:

```xml
<DefaultLocale>en-us</DefaultLocale>
<SourceLocation DefaultValue="https://contoso.com/taskpane.html"/>
<Override Locale="de-de" SourceLocation="https://contoso.com/de/taskpane.html"/>
<Override Locale="fr-fr" SourceLocation="https://contoso.com/fr/taskpane.html"/>
```

Outlook picks which URL to load based on the user's Office display language *before your page even starts loading*. If you pre-render locale-specific HTML shells, the correct language is already on screen with zero JS. This only works for locales you explicitly enumerate, and it can't react to things like content language mid-session — but it's the only truly "pre-JS" option.

## 2. Page load, before `Office.js` is ready
Once your iframe starts loading, you have normal browser APIs available immediately:

```js
const guess = navigator.language || navigator.languages?.[0] || 'en-US';
```

Caveats:
- This is the **browser/OS** language, not necessarily Outlook's configured display language — in OWA these are often the same, but in Outlook desktop/Mac (WebView-hosted) they can diverge, especially on shared machines or if the user set a different Office display language than their OS.
- `document.documentElement.lang` won't help — your add-in loads in its own iframe with a fresh document; Outlook doesn't propagate its own `lang` attribute into it.
- The `_host_Info` query parameter Office appends to your URL does *not* include locale — it's host/platform/version info, not language. Don't rely on parsing it for this.
- If you want a real query-string-based locale at this stage, you'd have to synthesize it yourself via the manifest override technique above (put `?lang=de-de` in each `Override` URL).

So `navigator.language` is a reasonable *provisional* guess to render an initial loading state, but treat it as disposable.

## 3. After `Office.onReady()` — authoritative
Once Office.js has initialized:

```js
Office.onReady(() => {
  const uiLang = Office.context.displayLanguage;   // Office UI/menu language, e.g. "de-DE"
  const contentLang = Office.context.contentLanguage; // language of the mail item content
  // now switch your UI to the real value
});
```

`displayLanguage` mirrors the Office application's display-language setting (File > Options > Language), and is the closest thing to "the user's actual language" for chrome/UI purposes. `contentLanguage` is separate and reflects the item's content locale — relevant if you're localizing based on the email itself rather than the app UI.

## Recommended pattern

```js
// 1. Immediate best-guess for the loading screen
let lang = (navigator.language || 'en-US');
renderUI(lang);

// 2. Swap to authoritative value once available
Office.onReady(() => {
  lang = Office.context.displayLanguage || lang;
  renderUI(lang);          // re-render if it changed
  sessionStorage.setItem('addin-lang', lang); // optional: speeds up next load
});
```

A couple of extra tips:
- Cache the Office.js-derived value (session/local storage) so subsequent task pane opens in the same session can render correctly on first paint instead of waiting on `onReady` again.
- Only normalize/match against your supported locale list *after* you have the `Office.context` value — don't lock in a UI language choice from `navigator.language` in a way that's expensive to undo (e.g., don't fire off a translation API call based on the guess).
- Be aware `displayLanguage` can technically change mid-session in rare host reconfiguration cases, but in practice checking it once after `onReady` is sufficient for most add-ins.
