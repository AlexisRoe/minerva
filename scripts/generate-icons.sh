#!/usr/bin/env bash
#
# generate_icons.sh
#
# Generates a full set of PNG icon sizes (for PWA manifests and Outlook
# web add-in manifests) from a single source PNG, then optimizes file size.
#
# Requires: macOS `sips` (built-in). Optimization is optional and uses
# `pngquant` and `optipng` if installed via Homebrew:
#     brew install pngquant optipng
#
# Usage:
#   ./generate_icons.sh path/to/source.png [output_dir]
#
# Output:
#   output_dir/icon-<size>.png            for each standard size
#   output_dir/icon-<size>-maskable.png   for maskable sizes (192, 512)

set -euo pipefail

# ---------- Config ----------

# Standard (non-maskable) sizes, in pixels (square)
SIZES=(16 25 32 48 64 80 128 144 150 192 512)

# Sizes that also need a "maskable" version (padded safe zone)
MASKABLE_SIZES=(192 512)

# Maskable icons need content inset within a safe zone (Android/PWA spec
# recommends the important content fit within ~80% of the canvas).
# We scale content down to this percentage, then pad to full size.
MASKABLE_SCALE_PERCENT=80

# Background fill color for the padded area on maskable icons.
# Use a solid color since maskable icons are commonly rendered opaque.
# Change to match your brand background, e.g. "FFFFFF" for white.
MASKABLE_BG_COLOR="FFFFFF"

# ---------- Args ----------

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/source.png [output_dir]" >&2
  exit 1
fi

SRC="$1"
OUT_DIR="${2:-./icons}"

if [[ ! -f "$SRC" ]]; then
  echo "Error: file not found: $SRC" >&2
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "Error: 'sips' not found. This script requires macOS." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# ---------- Source sanity checks ----------

# sips reports "<nil>" for files it cannot read, so only treat all-digit
# results as real dimensions; sips itself reports the error further down.
SRC_W=$(sips -g pixelWidth  "$SRC" 2>/dev/null | awk '/pixelWidth/  {print $2}')
SRC_H=$(sips -g pixelHeight "$SRC" 2>/dev/null | awk '/pixelHeight/ {print $2}')
[[ "$SRC_W" =~ ^[0-9]+$ ]] || SRC_W=""
[[ "$SRC_H" =~ ^[0-9]+$ ]] || SRC_H=""

# `sips -z` forces exact dimensions, so a non-square source is stretched
# rather than cropped or letterboxed.
if [[ -n "$SRC_W" && -n "$SRC_H" && "$SRC_W" != "$SRC_H" ]]; then
  echo "Warning: source is ${SRC_W}x${SRC_H} (not square); icons will be stretched." >&2
fi

if [[ -n "$SRC_W" && "$SRC_W" -lt 512 ]]; then
  echo "Warning: source is ${SRC_W}px wide; the 512px icons will be upscaled." >&2
fi

# ---------- sips wrapper ----------

# sips writes a harmless "<CGColor ...>" debug line to stderr whenever
# --padColor is used. Drop that chatter but keep real errors and the exit code.
sips_quiet() {
  local err status=0
  err=$(sips "$@" 2>&1 >/dev/null) || status=$?
  if [[ -n "$err" ]]; then
    printf '%s\n' "$err" | { grep -v '^<CGColor' >&2 || true; }
  fi
  return $status
}

# ---------- Optional optimizer detection ----------

HAVE_PNGQUANT=0
HAVE_OPTIPNG=0
command -v pngquant >/dev/null 2>&1 && HAVE_PNGQUANT=1
command -v optipng  >/dev/null 2>&1 && HAVE_OPTIPNG=1

if [[ $HAVE_PNGQUANT -eq 0 && $HAVE_OPTIPNG -eq 0 ]]; then
  echo "Note: neither pngquant nor optipng found. Skipping optimization."
  echo "      Install with: brew install pngquant optipng"
fi

optimize_png() {
  local file="$1"
  if [[ $HAVE_PNGQUANT -eq 1 ]]; then
    # Lossy palette-based compression, overwrite in place, keep alpha
    pngquant --force --skip-if-larger --strip --quality=70-95 \
      --output "$file" "$file" 2>/dev/null || true
  fi
  if [[ $HAVE_OPTIPNG -eq 1 ]]; then
    # Lossless recompression
    optipng -o4 -quiet "$file" || true
  fi
}

# ---------- Generate standard sizes ----------

echo "Generating standard icon sizes..."
for size in "${SIZES[@]}"; do
  out="$OUT_DIR/icon-${size}.png"
  sips_quiet -s format png -z "$size" "$size" "$SRC" --out "$out"
  optimize_png "$out"
  echo "  -> $out"
done

# ---------- Generate maskable sizes ----------

echo "Generating maskable icon sizes..."
for size in "${MASKABLE_SIZES[@]}"; do
  inner=$(( size * MASKABLE_SCALE_PERCENT / 100 ))
  tmp="$OUT_DIR/.tmp-inner-${size}.png"
  out="$OUT_DIR/icon-${size}-maskable.png"

  # 1) Resize content down to the safe-zone inner size
  sips_quiet -s format png -z "$inner" "$inner" "$SRC" --out "$tmp"

  # 2) Pad out to full canvas with the background color (centered)
  sips_quiet -s format png -p "$size" "$size" --padColor "$MASKABLE_BG_COLOR" \
    "$tmp" --out "$out"

  rm -f "$tmp"
  optimize_png "$out"
  echo "  -> $out"
done

echo ""
echo "Done. Icons written to: $OUT_DIR"
if [[ $HAVE_PNGQUANT -eq 0 || $HAVE_OPTIPNG -eq 0 ]]; then
  echo "Tip: install pngquant/optipng for smaller file sizes:"
  echo "     brew install pngquant optipng"
fi
