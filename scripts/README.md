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