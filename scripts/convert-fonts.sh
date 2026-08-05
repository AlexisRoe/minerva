#!/usr/bin/env bash
#
# convert-fonts.sh
#
# Converts every .ttf/.otf in shared/assets/fonts/ to .woff2 and removes the
# original. woff2 is Brotli over the same glyph data -- identical rendering,
# roughly 60% smaller -- and the repo keeps only the converted files, since
# they are what the apps and Storybook serve.
#
# Run it after dropping a new upstream font file into shared/assets/fonts/.
# Nothing else in the build has to change: the URLs in shared/assets/fonts.css
# and the preload links in the apps' index.html name the .woff2 directly, and
# `sharedFonts()` in vite.fonts.ts already serves that content type.
#
# Requires: python3 (macOS built-in). fontTools and Brotli are installed into a
# throwaway virtualenv under the system temp directory, so nothing is added to
# the machine's Python.
#
# Usage:
#   ./convert-fonts.sh

set -euo pipefail

FONT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/shared/assets/fonts"
VENV_DIR="${TMPDIR:-/tmp}/minerva-fonttools-venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: 'python3' not found." >&2
  exit 1
fi

shopt -s nullglob
SOURCES=("$FONT_DIR"/*.ttf "$FONT_DIR"/*.otf)
shopt -u nullglob

if [[ ${#SOURCES[@]} -eq 0 ]]; then
  echo "Nothing to convert: no .ttf or .otf in $FONT_DIR"
  echo "(Already-converted .woff2 files are left alone.)"
  exit 0
fi

# The venv is reused across runs but lives in the temp directory, so a cleared
# temp just means one slower run rather than a broken one.
if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "Preparing fontTools in $VENV_DIR ..."
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet "fonttools[woff]"
fi

echo "Converting ${#SOURCES[@]} font file(s) to woff2..."
for src in "${SOURCES[@]}"; do
  out="${src%.*}.woff2"

  # The glyph-count assertion is the point of doing this in fontTools rather
  # than piping bytes: a truncated read would otherwise produce a valid-looking
  # font missing half its coverage.
  "$VENV_DIR/bin/python" - "$src" "$out" <<'PY'
import sys

from fontTools.ttLib import TTFont

source_path, output_path = sys.argv[1], sys.argv[2]

font = TTFont(source_path)
font.flavor = "woff2"
font.save(output_path)

before = TTFont(source_path)["maxp"].numGlyphs
after = TTFont(output_path)["maxp"].numGlyphs
if before != after:
    raise SystemExit(f"glyph count changed for {source_path}: {before} -> {after}")
PY

  before_size=$(wc -c <"$src" | tr -d ' ')
  after_size=$(wc -c <"$out" | tr -d ' ')
  rm -f "$src"

  printf '  -> %s (%s kB -> %s kB)\n' \
    "$(basename "$out")" "$((before_size / 1024))" "$((after_size / 1024))"
done

echo ""
echo "Done. The .ttf/.otf originals were removed; the .woff2 files are what ships."
