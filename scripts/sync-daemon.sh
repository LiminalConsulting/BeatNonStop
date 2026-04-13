#!/bin/bash
# Polls origin/main; if new commits exist, runs /sync via Claude Code headless.
set -u

REPO="/Users/davidrug/RealDealVault/BeatNonStop"
CLAUDE="/opt/homebrew/bin/claude"
LOG="$HOME/.beatnonstop-sync.log"

cd "$REPO" || exit 1

# Ensure PATH includes git/node for launchd context
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

ts() { date "+%Y-%m-%d %H:%M:%S"; }

git fetch origin main --quiet 2>>"$LOG" || { echo "[$(ts)] fetch failed" >>"$LOG"; exit 0; }

LOCAL=$(git rev-parse @ 2>/dev/null)
REMOTE=$(git rev-parse @{u} 2>/dev/null)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(ts)] new commits on origin — running /sync" >>"$LOG"
"$CLAUDE" -p "/sync" --permission-mode acceptEdits >>"$LOG" 2>&1
echo "[$(ts)] /sync finished (exit $?)" >>"$LOG"
