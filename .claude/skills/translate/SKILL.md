---
name: translate
description: Verify and complete the translation catalogues in this repo. Use whenever user-facing strings are added, changed or removed, when asked to "translate", "check the translations", "add a language", or when the i18n checks report missing, stale or unknown keys. Drives the repo's i18n scripts, fills the gaps, and re-verifies that every catalogue is still valid JSON.
---

# Translating minerva-v2

**Translation work in this repo is a check-fill-recheck loop, not a free-hand edit of JSON files.** The
repository ships three i18n verification scripts that already know how to find every project, every
catalogue and every gap; your job is to read their output, write the missing strings, and prove the
result still passes. The scripts are the source of truth about what is wrong — never decide from
eyeballing the files.

**Run every command from the repository root, and treat the Makefile as the interface.** Never call
`npx`, `pnpm` or `biome` directly. The only commands invoked outside the Makefile are the direct
`python3 scripts/check-i18n-*.py … --json` reads described below, which exist because the Makefile
targets are shaped for humans rather than for parsing.

| Command | What it does |
| --- | --- |
| `make verify-i18n` | JSON validity, then missing/stale keys, then unknown keys used in code |
| `make verify-i18n-verbose` | The same, listing every finding with the English source string |
| `make verify` | `lint`, `typecheck`, `test` — the general gate, run after editing catalogues |
| `python3 scripts/check-i18n-keys.py <project> --default-lang en --json` | The machine-readable working set |
| `python3 scripts/check-i18n-usage.py <project> --default-lang en --json` | Keys referenced by `t(…)` that no catalogue defines |

Each script's `--help` carries an epilog written explicitly for agents, documenting its discovery
rules, exit codes and JSON schema. Read it rather than guessing at a flag.

## Step 0 — Orient

**The source language is always `en`, for every project.** Everything else is derived from disk.

- The project path defaults to `apps/frontend/minerva-button`. `I18N_PROJECTS` in the `Makefile`
  holds the list the checks currently cover; the scripts accept several project paths at once.
- **Discover the target locales by listing the project's `src/i18n/locales/` directory and dropping
  `en.json`.** Do not carry a hardcoded language list into your work — a locale may have been added
  or removed since this skill was written.
- The catalogues on disk are flat: one file per language, top-level keys, no namespace nesting. The
  `app` namespace comes from `defaultNS` in `src/i18n/i18next.instance.ts` and exists only in code.
  Never wrap catalogue contents in an `app` object.

## Step 1 — Assess

Start with `make verify-i18n` for the verdict, then take the working set as JSON:

```bash
python3 scripts/check-i18n-keys.py apps/frontend/minerva-button --default-lang en --json
```

The payload gives you, per language: `missing` as an object mapping each dotted key to **the English
source string** (so you can translate straight from it), `stale` as the list of keys to delete, and
`type_mismatch` as entries whose value type diverges from English.

**When the trigger was "new strings were added in the code", check usage first.** The errors from
`check-i18n-usage.py --json` are keys that `t(…)` references but `en.json` does not define — the
English catalogue must be extended before any translation happens, otherwise you would be
translating a string that does not exist yet. Its warnings about dynamic lookups never fail the
build and need no action.

## Step 2 — Translate

For each target locale, fill every `missing` key from its English source string and delete every
`stale` key.

- **Placeholders are structure, not text.** Preserve i18next interpolation (`{{name}}`) and any ICU
  plural or select blocks verbatim; never translate, rename or reorder what sits inside `{{ }}`.
- Match the English value's type exactly — a `type_mismatch` entry means this rule was broken.
- These are button, form and status strings: keep the register plain and the length close to the
  English, so nothing overflows its control.
- `ar` is right-to-left. Translate the text only; do not insert directional control characters.
- Keep the existing key order and 2-space indentation, and edit the files in place with `Edit`
  rather than regenerating them, so the diff stays reviewable.

## Step 3 — Verify

**This step is mandatory — translation work is not done until both commands exit clean.**

```bash
make verify-i18n
make verify
```

- A `check-i18n-json.py` failure means a catalogue is no longer valid JSON or no longer has an object
  at its root. Fix that before looking at anything else; nothing downstream is meaningful until the
  files parse.
- `make verify` matters because `src/i18n/i18next.d.ts` derives `CustomTypeOptions['resources']` from
  the English catalogue, so any key change is checked at compile time by `typecheck`.
- Loop back to step 1 until the checks pass. If something genuinely cannot be resolved, say so
  plainly and show the remaining findings — do not report success over a failing check.

## Adding a new language

Copy `en.json` to `<lang>.json`, translate every value, then wire the locale up in three places:

1. `src/i18n/i18next.instance.ts` — import the catalogue into `resources` and add the tag to
   `supportedLngs`.
2. `shared/typescript-lib/src/languages/available-languages.ts` — add the member to the `Languages`
   enum.
3. `shared/typescript-lib/src/languages/languages.utils.ts` — confirm
   `convertLanguageTagToInternalLanguage` maps the incoming tag.

Name the enum member after the language in English (`Dutch`, `Portuguese`, …) and give it the BCP 47
tag as its value. The tag, not the member name, is what the catalogues and i18next are keyed on.

Finish with step 3 as usual.
