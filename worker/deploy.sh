#!/usr/bin/env bash
# Beat Nonstop bot — one-shot deploy script.
# Prerequisites: workers.dev subdomain registered + GITHUB_TOKEN filled in .secrets.local.
# Run from repo root: ./worker/deploy.sh

set -euo pipefail

cd "$(dirname "$0")"

# Load secrets from .secrets.local (repo root)
SECRETS="../.secrets.local"
if [ ! -f "$SECRETS" ]; then
  echo "✘ .secrets.local not found at $SECRETS"
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$SECRETS"; set +a

# Sanity: required vars
for v in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID WEBHOOK_SECRET SYNC_API_KEY GITHUB_TOKEN GITHUB_REPO BUILDER_USER_ID APPROVAL_THRESHOLD; do
  if [ -z "${!v:-}" ]; then
    echo "✘ $v is empty in .secrets.local"
    exit 1
  fi
done

echo "→ Deploying Worker..."
npx wrangler deploy

echo ""
echo "→ Pushing secrets..."
for secret in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID WEBHOOK_SECRET SYNC_API_KEY GITHUB_TOKEN GITHUB_REPO BUILDER_USER_ID APPROVAL_THRESHOLD; do
  echo "   · $secret"
  printf "%s" "${!secret}" | npx wrangler secret put "$secret" 2>&1 | grep -v "^$" | tail -2
done

echo ""
echo "→ Registering Telegram webhook..."
# Fetch worker URL from the deploy subdomain automatically
WORKER_URL_GUESS=$(npx wrangler deployments list 2>&1 | grep -oE 'https://beatnonstop-bot\.[a-zA-Z0-9.-]+\.workers\.dev' | head -1 || true)
if [ -z "$WORKER_URL_GUESS" ]; then
  echo "⚠  Could not auto-detect Worker URL. Check Cloudflare dashboard and paste it into .secrets.local as WORKER_URL."
  exit 1
fi
echo "   Worker URL: $WORKER_URL_GUESS"

curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=${WORKER_URL_GUESS}/telegram" \
  --data-urlencode "secret_token=${WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["message","message_reaction"]'
echo ""

echo ""
echo "→ Writing WORKER_URL to .secrets.local and creating .env.sync..."
# Update WORKER_URL line in .secrets.local
tmpfile=$(mktemp)
awk -v url="$WORKER_URL_GUESS" '/^WORKER_URL=/ {print "WORKER_URL=" url; next} {print}' "$SECRETS" > "$tmpfile"
mv "$tmpfile" "$SECRETS"

# Write .env.sync
cat > ../.env.sync <<EOF
WORKER_URL="$WORKER_URL_GUESS"
SYNC_API_KEY="$SYNC_API_KEY"
EOF

echo ""
echo "✓ Done."
echo ""
echo "Next: open Telegram, send /ping to the BeatNonStop group."
echo "Bot should reply: pong · <timestamp>"
