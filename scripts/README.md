# Custom scripts

`make setup` runs `check-dependencies.sh`, then `generate-certs.sh`, then `pnpm install`, stopping at the first failure. Each script also has its own target and can be run on its own — the sections below cover them individually.

## check-dependencies.sh

Checks whether the local tooling required for this project is installed: Homebrew, pnpm, Node.js, Docker, and make.

For each tool it reports:
- installation status (installed / not installed)
- installed version
- the command used to check for it
- how to install/update to the latest version (2026)

It also prints the script version and the time the check was run, and finishes with a summary count of installed vs. missing tools.

### Usage

```sh
./scripts/check-dependencies.sh
```

Or via the Makefile target:

```sh
make check-deps
```

Exits with status `0` if everything is installed, or `1` if anything is missing.

## initial-setup.sh

Prepares a fresh local checkout for development. For now it sets up the local environment file.

It:
- checks that `.env.template` exists, and stops with an error if it doesn't
- backs up an existing `.env` as `.env.<timestamp>` (e.g. `.env.20260727-134500`) before touching it
- copies `.env.template` to `.env` (readable/writable by you only, `chmod 600`)
- prints a summary of what happened, including the backup path if one was created

Backups stay in the repo root and are gitignored (`.env.[0-9]*`). Copy any values you still need from the backup into the new `.env` — the copy is a plain template, existing values are not merged.

### Usage

```sh
./scripts/initial-setup.sh
```

Or via the Makefile target:

```sh
make copy-env
```

This one is not part of `make setup` — it writes a file you are expected to edit, and re-running it moves your existing `.env` aside.

Exits with status `0` on success, or `1` if `.env.template` is missing or the backup/copy fails.

## generate-certs.sh

Creates locally-trusted TLS certificates (via [mkcert](https://github.com/FiloSottile/mkcert)) so the frontend projects, the shared ui-lib, and the backend services can be run over HTTPS, both directly and inside Docker.

It:
- checks that `mkcert` is installed, and installs/trusts its local CA
- checks that `infra/cert` exists, creating it if missing
- checks whether a certificate already exists and is still valid (regenerating if it's missing, expired, or expires within 30 days)
- generates a certificate/key pair covering `localhost`, `*.localhost`, `127.0.0.1`, and `::1` if needed
- prints a summary of what happened, including the certificate/key paths and expiry date

The certificate is written to `infra/cert/minerva-local.pem` with its key at `infra/cert/minerva-local-key.pem`. Both are gitignored — run the script locally rather than committing them. Point frontend dev servers, the ui-lib dev server, and dockerised services' TLS config at these files (e.g. `https://minerva-manager.localhost`, `https://api.localhost`).

### Usage

```sh
./scripts/generate-certs.sh
```

Or via the Makefile target:

```sh
make certs
```

Exits with status `0` on success, or `1` if mkcert is missing or certificate generation fails.

## generate-icons.sh

Generates a full set of PNG icon sizes from a single source image, for PWA manifests and Outlook web add-in manifests, then optimizes the resulting files.

It:
- checks that the source file exists and that `sips` (macOS built-in) is available
- warns if the source is not square, or is smaller than 512px (see caveats below)
- writes one `icon-<size>.png` per standard size: 16, 25, 32, 48, 64, 80, 128, 144, 150, 192, 512
- writes an additional `icon-<size>-maskable.png` for 192 and 512, with the content scaled to 80% and padded to the full canvas so it survives Android/PWA safe-zone cropping
- optimizes every file with `pngquant` (lossy palette) and `optipng` (lossless), if installed

Optimization is optional — if neither tool is present the script says so and continues. Install them with:

```sh
brew install pngquant optipng
```

### Usage

```sh
./scripts/generate-icons.sh path/to/source.png [output_dir]
```

Or via the Makefile target:

```sh
make icons SRC=path/to/source.png
make icons SRC=path/to/source.png OUT=apps/frontend/minerva-manager/public/icons
```

The output directory defaults to `./icons` and is created if missing.

### Caveats

- **macOS only** — it relies on `sips`.
- **Use a square source of at least 512x512.** Sizes are produced with `sips -z`, which forces exact dimensions, so a non-square source is stretched rather than cropped or letterboxed. The script warns in both cases but still runs.
- Maskable icons are padded with a solid background (`MASKABLE_BG_COLOR`, white by default) since they are commonly rendered opaque. Change that variable at the top of the script to match your brand background.

Exits with status `0` on success, or non-zero if the source is missing, `sips` is unavailable, or conversion fails.
## The i18n check scripts

Three Python scripts check the translation catalogues. They need nothing but `python3` — standard library only, no venv and no install step. `i18n_common.py` is a shared helper module they import; it is not run directly.

All three take **one or more project directories** as positional arguments and share the same flags:

- `--default-lang` / `-d` — the reference language everything is compared against (default `en`); not used by `check-i18n-json.py`
- `--verbose` / `-v` — more detail: nothing is truncated, and every missing key is printed together with its string in the default language, so it is clear what has to be translated without opening a single file
- `--json` — print a machine-readable report on stdout instead of the human summary
- `--help` — a full description written for an AI agent: what the script checks, how to invoke it, what each exit code means, and the exact shape of the `--json` payload

The human summary is grouped per project and per language, marked with `✔` (fine), `?` (warning, does not fail the run) and `✖` (failure), and coloured when it goes to a terminal. Colour is dropped automatically when the output is piped or redirected, when `NO_COLOR` is set, and on a dumb terminal; set `FORCE_COLOR=1` to keep it in a pipe.

Catalogues are found automatically: any `.json` file inside a `locales/`, `locale/`, `lang/` or `translations/` directory. Both layouts work and may be mixed — `locales/en.json` (one file per language) and `locales/en/app.json` (one folder per language, one file per namespace). `node_modules`, `dist`, `build` and dot-directories are never searched. Nested keys are compared as dotted paths, so `test.test.value` is a key like any other.

Run all three at once with:

```sh
make verify-i18n
make verify-i18n I18N_PROJECTS="apps/frontend/minerva-button apps/frontend/minerva-manager" I18N_LANG=en
```

`make verify-i18n-verbose` runs exactly the same three checks with `--verbose`, so every finding is listed in full together with the default language's source strings — that is the one to run when the next step is actually writing the translations. Both targets stop at the first script that fails, and both accept the same `I18N_PROJECTS` / `I18N_LANG` overrides. `I18N_FLAGS` passes extra flags to all three scripts, so only flags they all understand belong there (`-v`, `--json`); script-specific ones like `--fail-on` or `--include-tests` have to be used on a direct call.

### check-i18n-json.py

Parses every catalogue and reports whether it is valid JSON. An empty file or a root that is not an object counts as invalid. Run it first — the other two skip files that do not parse.

```sh
./scripts/check-i18n-json.py apps/frontend/minerva-button
./scripts/check-i18n-json.py apps/frontend/minerva-button -v
```

`-v` adds the key count, language and namespace of every valid file.

Exits `0` if every file parsed, `1` otherwise.

### check-i18n-keys.py

Compares every language against the default one, per namespace, and reports for each language either `valid` or how many keys are **missing** (in the default catalogue, absent here) and how many are **stale** (present here, gone from the default catalogue). Values whose type differs from the default language (an object where a string is expected, say) are reported as type mismatches.

```sh
./scripts/check-i18n-keys.py apps/frontend/minerva-button -d en
./scripts/check-i18n-keys.py apps/frontend/minerva-button -v
./scripts/check-i18n-keys.py apps/frontend/minerva-button --fail-on missing
```

By default at most 20 missing and 20 stale keys are listed per language, by name only. `-v` lists all of them and prints each missing key with its string in the default language (and each stale key with the string it still has), which turns the output into a ready-to-use translation worklist:

```
✖ zh    1 missing
    missing  intro
             en: "Send the open message to Minerva for processing."
```

`--fail-on missing|stale|any` (default `any`) decides which findings make the run fail; use `--fail-on missing` to tolerate leftover keys.

Exits `0` when every language passes, `1` otherwise.

### check-i18n-usage.py

Scans the project's `.ts`/`.tsx`/`.js`/`.jsx` for `t('key')`, `translate('key')` and `i18nKey="key"`, and reports every literal key the default catalogue does not define — at runtime those render as the raw key. A leading `namespace:` prefix is stripped before the lookup.

Keys that only exist at runtime (`t(someVariable)`, template literals containing `${…}`) cannot be checked statically; they are printed as warnings with a `file:line` so they can be reviewed by hand, and never fail the run. `*.spec.*` and `*.test.*` are skipped unless `--include-tests` is passed. Finding unused catalogue keys is out of scope.

```sh
./scripts/check-i18n-usage.py apps/frontend/minerva-button -d en
./scripts/check-i18n-usage.py apps/frontend/minerva-button -v
```

`-v` adds the line of code behind every unknown key and the closest existing keys as a "did you mean" hint, and lists every literal key that did resolve together with the places it is used.

Exits `0` when every literal key exists, `1` otherwise.

### The `--json` contract

`--json` writes nothing but JSON to stdout, so it can be piped straight into a tool or an agent. Every payload has a top-level `ok` boolean and a `problems` array. `check-i18n-keys.py --json` is the interesting one for translating: each language carries `missing` as an object mapping the dotted key to **the default language's source string**, plus `stale` and `type_mismatch` arrays. One run therefore contains everything needed to produce the missing translations and to know which keys to drop. Run `--help` on a script for its full schema.
