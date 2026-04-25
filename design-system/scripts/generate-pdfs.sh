#!/bin/bash
# Generate PDFs from demo HTML files using headless Chrome.
# Usage: pnpm --filter @yohaku/design-system demo:pdf

set -e

# Locate Chrome on macOS, with fallback to standard Linux paths.
if [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME="google-chrome"
elif command -v chromium >/dev/null 2>&1; then
  CHROME="chromium"
else
  echo "Chrome not found. Install Google Chrome or set CHROME env var."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMOS_DIR="$(cd "$SCRIPT_DIR/../showcase/public/demos" && pwd)"

generate() {
  local name="$1"
  local html="$DEMOS_DIR/$name.html"
  local pdf="$DEMOS_DIR/$name.pdf"

  if [ ! -f "$html" ]; then
    echo "  ✗ source not found: $html"
    return 1
  fi

  printf "  → %-20s" "$name.pdf"

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --hide-scrollbars \
    --no-sandbox \
    --print-to-pdf="$pdf" \
    "file://$html" 2>/dev/null

  if [ -f "$pdf" ]; then
    local size
    size=$(du -h "$pdf" | awk '{print $1}')
    printf "ok (%s)\n" "$size"
  else
    printf "failed\n"
    return 1
  fi
}

echo "Generating PDFs from $DEMOS_DIR"
generate "demo-post"
generate "demo-post.en"
generate "demo-resume"
generate "demo-resume.en"
generate "demo-report"
generate "demo-report.en"
echo "Done."
