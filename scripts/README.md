# Custom scripts

Every script in this directory, what it does and how to run it. All of them are reachable through a Makefile target, which is the intended way in; each also runs on its own.

`make setup` is the one that chains several together, in the order the steps depend on each other, stopping at the first failure:

1. `check-dependencies.sh` — is the tooling there at all
2. `initial-setup.sh` — only if there is no `.env` yet
3. `bootstrap-secrets.sh` — fill the credentials nobody chooses
4. `generate-certs.sh` — local TLS
5. `pnpm install`, then a build of the shared libraries

| Script | Target | What it is for |
| ------ | ------ | -------------- |
| `check-dependencies.sh` | `make check-deps` | Is the local tooling installed |
| `initial-setup.sh` | `make copy-env` | Create `.env` from `.env.template` |
| `bootstrap-secrets.sh` | `make secrets` | Fill every empty credential in `.env` |
| `generate-secret.sh` | `make secret` | Generate one secret, print it or write it |
| `generate-certs.sh` | `make certs` | Locally-trusted TLS certificates |
| `generate-icons.sh` | `make icons` | PWA/Outlook PNG icon sizes from one source |
| `convert-fonts.sh` | `make fonts` | `.ttf`/`.otf` to `.woff2` |
| `shutdown-frontends.sh` | `make shutdown-fe` | Force-kill stuck Vite dev servers |
| `storybook-dev.sh` | `make storybook` | Storybook for the ui-lib, over HTTPS |
| `sync-workspace.sh` | (git hooks) | Re-install and rebuild after a checkout or merge |
| `check-i18n-*.py` | `make verify-i18n` | Translation catalogue checks |

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

`make setup` calls this only when there is no `.env` at all, and never otherwise: it writes a file you are expected to edit, and re-running it moves your existing one aside. Running `make copy-env` directly is always an explicit act.

Exits with status `0` on success, or `1` if `.env.template` is missing or the backup/copy fails.

## generate-certs.sh

Creates locally-trusted TLS certificates (via [mkcert](https://github.com/FiloSottile/mkcert)) so the frontend projects, the shared ui-lib, and the backend services can be run over HTTPS, both directly and inside Docker.

It:
- checks that `mkcert` is installed, and installs/trusts its local CA
- checks that `infra/cert` exists, creating it if missing
- regenerates the pair if it is missing, expired, expires within 30 days, **or no longer covers the same names as `CERT_DOMAINS`**
- prints a summary of what happened, including the certificate/key paths and expiry date

**There is no wildcard.** `*.localhost` does not work — browsers and OpenSSL both refuse a wildcard whose parent is a single-label TLD, so it matches nothing and `https://api.localhost` fails as a name mismatch rather than as a trust error. Every origin is therefore listed one by one in the `CERT_DOMAINS` array at the top of the script:

```
localhost  api.localhost  manager.localhost  button.localhost  reporter.localhost
storybook.localhost  assets.localhost  proxy.localhost  127.0.0.1  ::1
```

Giving a new service a hostname means adding a line there. Nothing else: the name-coverage check notices that the existing certificate no longer matches and writes a new one.

The certificate is written to `infra/cert/minerva-local.pem` with its key at `infra/cert/minerva-local-key.pem`. Both are gitignored — run the script locally rather than committing them. The Vite dev servers, Storybook and Caddy all read this one pair.

### Usage

```sh
./scripts/generate-certs.sh
./scripts/generate-certs.sh --quiet
```

Or via the Makefile target:

```sh
make certs
```

`--quiet` prints nothing unless it actually had to write a certificate. Every docker target runs it that way through `make preflight`, on every start rather than only when the files are missing — the failure it exists to catch is a certificate that is present and trusted but does not carry the hostname you opened, and that one is invisible until a browser refuses the page.

A regenerated certificate means every browser tab and dev server holding the old one has to be restarted, which is why that case is reported even under `--quiet`.

Exits with status `0` on success, or `1` if mkcert is missing or certificate generation fails.

## bootstrap-secrets.sh

Fills every credential the local stack needs but nobody chooses: the api's cookie secret, the three Postgres passwords, the Valkey password, Garage's RPC secret, admin token and S3 key pair, and go-camo's HMAC key.

Each is generated in the shape its consumer demands, which is the reason this exists rather than ten `make secret` calls: Garage rejects an RPC secret that is not exactly 64 hexadecimal characters, its access key id has to be `GK` followed by 24 more, and go-camo parses its key as hex. Getting one wrong surfaces as a service that starts and then refuses every request.

It:
- refuses to run without a `.env` (that is `make copy-env`) or without `openssl`
- **never replaces a value that is already there**, so it is safe on every run
- refuses to append a name that is not already in `.env`, since a missing one is far more often a variable that moved than a new one — it reports those and exits `1`
- writes through the existing file, so the `chmod 600` that `initial-setup.sh` set survives

Rotating a credential is deliberately not something this does. A Garage RPC secret changed under a running cluster locks the node out of its own data; use `FORCE=1 make secret VAR=…` when that is genuinely what you want.

### Usage

```sh
./scripts/bootstrap-secrets.sh
DRY_RUN=1 ./scripts/bootstrap-secrets.sh
```

Or via the Makefile target:

```sh
make secrets
DRY_RUN=1 make secrets
```

Note that the Postgres passwords and the Garage credentials only take effect on a volume that does not exist yet — see `infra/README.md`, and `make reset-db` / `make reset-storage`.

Exits `0` when everything is filled in, `1` if a variable is missing from `.env` or the file could not be written.

## generate-secret.sh

The single-value version of the above: one cryptographically random secret from `openssl`, either printed or written into `.env`.

- With no argument it prints the secret on stdout and nothing else, so `make secret | pbcopy` is the whole workflow. Commentary goes to stderr.
- With a variable name it writes it into `.env`, and **refuses to overwrite an existing value** unless `FORCE=1`. Rotating one invalidates everything already signed with it — every cookie a running api handed out.
- It will not append an unknown variable name, for the same reason as `bootstrap-secrets.sh`.
- `HEX=1` produces 64 hexadecimal characters instead of base64, which is what Garage and go-camo require.

### Usage

```sh
./scripts/generate-secret.sh                              # print one
./scripts/generate-secret.sh BE_API_COOKIE_SECRET          # write it
HEX=1 ./scripts/generate-secret.sh INFRA_CAMO_KEY          # 64 hex characters
FORCE=1 ./scripts/generate-secret.sh BE_API_COOKIE_SECRET  # rotate on purpose
```

Or via the Makefile target:

```sh
make secret
make secret VAR=BE_API_COOKIE_SECRET
make secret HEX=1 VAR=INFRA_CAMO_KEY
FORCE=1 make secret VAR=BE_API_COOKIE_SECRET
```

Exits `0` on success, `1` if openssl is missing, there is no `.env`, the name is unknown, or the value is already set and `FORCE` is not `1`.

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

## convert-fonts.sh

Converts every `.ttf`/`.otf` in `shared/assets/fonts/` to `.woff2` and deletes the original. woff2 is Brotli over the same glyph data — identical rendering, roughly 60% smaller — and the repository keeps only the converted files, since those are what the apps and Storybook serve.

Run it after dropping a new upstream font file into `shared/assets/fonts/`. Nothing else in the build changes: the `url()`s in `shared/assets/fonts.css` and the preload links in the apps' `index.html` name the `.woff2` directly, and `sharedFonts()` in `vite.fonts.ts` already serves that content type.

Requires `python3` (macOS built-in). fontTools and Brotli are installed into a throwaway virtualenv under the system temp directory, so nothing is added to the machine's Python.

### Usage

```sh
./scripts/convert-fonts.sh
```

Or via the Makefile target:

```sh
make fonts
```

Already-converted `.woff2` files are left alone, and a directory with nothing to convert is not an error.

## shutdown-frontends.sh

Force-kills the local Vite dev servers for minerva-button and minerva-manager. Ctrl+C normally does this; the script is for when it did not — a detached `vite`, a shell closed out from under it, a port still held after `make dev-*` exited.

Deliberately blunt: SIGTERM, a few seconds' grace, then SIGKILL.

Two things keep that from being dangerous:

- **Only processes whose command line mentions `vite` are killed.** Anything else listening on those ports is reported and left alone, because the swept range overlaps ports this repo does not own.
- Vite falls forward to the next free port when its configured one is taken (4101 → 4102 → …), so both configured ports are swept together with the following `PORT_SCAN_RANGE` (default 9) ports each. A stuck server is often not on the port you expect.

### Usage

```sh
./scripts/shutdown-frontends.sh
DRY_RUN=1 ./scripts/shutdown-frontends.sh
```

Or via the Makefile target:

```sh
make shutdown-fe
DRY_RUN=1 make shutdown-fe
```

`DRY_RUN=1` lists what would be killed and touches nothing.

## storybook-dev.sh

Starts Storybook for `shared/ui-lib` on port 4301 (`STORYBOOK_PORT` to override).

It exists because Storybook runs Vite in middleware mode behind its own Node server, so the `server.https` option in a Vite config is ignored — TLS has to be passed on the command line. The script mirrors the fallback in `vite.https.ts`: HTTPS when the mkcert pair exists, plain HTTP when it does not, so a fresh clone still boots before `make certs` has run. It also passes mkcert's root CA, since Storybook otherwise counts the certificate as self-signed.

### Usage

```sh
./scripts/storybook-dev.sh
```

Or via the Makefile target:

```sh
make storybook
```

## sync-workspace.sh

Brings the working copy's dependencies and shared-library builds back in step with the revision just checked out or merged. Run from the `post-checkout` and `post-merge` git hooks rather than by hand.

The apps resolve `@minerva/typescript-lib` and `@minerva/ui-lib` through their built `dist/` directories, which are gitignored. Pulling a change to `shared/**` therefore leaves every consumer typechecking against stale declarations, with errors that name the old symbols and look nothing like the change that caused them. A moved `pnpm-lock.yaml` leaves `node_modules` out of date the same way.

This is a convenience, not a guarantee — `make typecheck` depends on `build-libs`, so the stale-`dist` failure cannot survive a verification run either way. Running here just means you rarely meet it.

### Usage

```sh
./scripts/sync-workspace.sh <old-rev> <new-rev>
```

When `<old-rev>` is absent, empty or unresolvable — a fresh clone, an orphan checkout — the sync runs unconditionally, because nothing can be proven unnecessary.

**Always exits `0`.** It runs from `post-*` hooks, after the operation git was asked to perform has already succeeded; reporting failure there would be misleading and, on `post-checkout`, actively confusing. Problems go to stderr and are left for the next `make` to surface properly.

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
