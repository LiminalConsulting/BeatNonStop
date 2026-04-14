#!/usr/bin/env bash
# Promote /staging/ → site root, stripping staging-only markers from HTML files.
# Mirrors worker/src/index.js :: stripStagingMarkers + promoteStagingToRoot so
# that local owner-override promotes produce the same output as the Worker's
# vote-driven promote flow.
#
# Usage: ./scripts/promote-staging.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d staging ]]; then
  echo "error: no staging/ directory" >&2
  exit 1
fi

copied=0
skipped=0

while IFS= read -r -d '' src; do
  rel="${src#staging/}"
  if [[ "$rel" == "README.md" ]]; then
    skipped=$((skipped+1))
    continue
  fi

  dest="$rel"
  mkdir -p "$(dirname "$dest")"

  if [[ "$rel" == *.html ]]; then
    node -e '
      const fs = require("fs");
      const src = process.argv[1];
      const dest = process.argv[2];
      let html = fs.readFileSync(src, "utf8");
      html = html
        .replace(/<meta\s+name="robots"\s+content="noindex,\s*nofollow"\s*\/?>\s*\n?/gi, "")
        .replace(/\[STAGING\]\s*/g, "")
        .replace(/<!--\s*Cache control\s*-->\s*\n\s*<meta\s+http-equiv="Cache-Control"[^>]*>\s*\n\s*<meta\s+http-equiv="Pragma"[^>]*>\s*\n\s*<meta\s+http-equiv="Expires"[^>]*>\s*\n?/gi, "")
        .replace(/<style>\s*\.staging-banner\s*\{[^}]*\}\s*body\s*\{[^}]*\}\s*<\/style>\s*\n?/gs, "")
        .replace(/<div\s+class="staging-banner">[\s\S]*?<\/div>\s*\n?/g, "")
        .replace(/<script>\s*fetch\(location\.href[\s\S]*?<\/script>\s*\n?/g, "");
      fs.writeFileSync(dest, html);
    ' "$src" "$dest"
  else
    cp "$src" "$dest"
  fi

  copied=$((copied+1))
done < <(find staging -type f -print0)

echo "promoted: $copied files copied, $skipped skipped"
