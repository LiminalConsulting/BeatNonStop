# Beat Nonstop Bot — Setup (idiot-proof edition)

One-time setup. After this, everything runs itself except the daily `/sync` you run in Claude Code.

**Total time: ~30 minutes.** All services free.

---

## What you're setting up

- **Telegram bot** — the interface the team uses
- **Cloudflare Worker** — always-on brain (no LLM, just logic) that talks to Telegram and commits to this repo
- **GitHub repo** — the database. Every fact, every message, every vote lives here
- **`/sync` command** — you run this in Claude Code once a day; it answers questions, updates state, queues outbound actions for team approval

---

## Part 1 — Create the Telegram bot (5 min)

1. Open Telegram, search for **@BotFather**, start a chat.
2. Send `/newbot`.
3. Name: `Beat Nonstop` (or whatever). Username: must end in `bot`, e.g. `beatnonstop_luanova_bot`.
4. **Save the token** BotFather gives you. Looks like `7834...:AAH...`. This is `TELEGRAM_BOT_TOKEN`.
5. Send BotFather `/setprivacy` → pick your bot → **Disable**. (Lets it read all group messages, required for inbox logging.)
6. Send BotFather `/mybots` → pick your bot → **Bot Settings** → **Allow Groups?** → **Turn on**.

### Create the group

7. In Telegram, create a new group. Add your bot and your 3 friends.
8. Promote the bot to admin (so it can read reactions reliably). Group settings → Administrators → Add → pick the bot → give it "Pin messages" + "Delete messages" (or just default admin rights).

### Get the chat id

9. In the group, send any message.
10. In a browser, open: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
11. Find `"chat":{"id":-100...` — copy that negative number. This is `TELEGRAM_CHAT_ID`.

### Get your Telegram user id (David)

12. Message **@userinfobot** on Telegram. It replies with your numeric id. Save it — this is `BUILDER_USER_ID`. You're excluded from vote quorum.

---

## Part 2 — Deploy the Cloudflare Worker (15 min)

### First-time tooling

1. Install wrangler globally (once per machine):
   ```bash
   npm install -g wrangler
   ```
2. Log in:
   ```bash
   wrangler login
   ```
   (Opens browser. Cloudflare free account signup takes 2 min if you don't have one.)

### Generate secrets

Make two random strings. Example:
```bash
openssl rand -hex 32   # run twice; copy the output each time
```
First one → `WEBHOOK_SECRET`. Second → `SYNC_API_KEY`.

### Get a GitHub token

3. Go to https://github.com/settings/tokens?type=beta → **Generate new token (fine-grained)**.
4. Repository access → Only select: `LiminalConsulting/BeatNonStop`.
5. Permissions → Repository → **Contents: Read and write**.
6. Generate, copy. This is `GITHUB_TOKEN`.

### Deploy

```bash
cd worker
npm install
wrangler deploy
```

You'll get a URL like `https://beatnonstop-bot.<your-subdomain>.workers.dev`. Save it — this is `WORKER_URL`.

### Set secrets (each prompts for value)

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler secret put WEBHOOK_SECRET
wrangler secret put SYNC_API_KEY
wrangler secret put GITHUB_TOKEN
wrangler secret put GITHUB_REPO        # LiminalConsulting/BeatNonStop
wrangler secret put BUILDER_USER_ID    # your numeric Telegram id
wrangler secret put APPROVAL_THRESHOLD # 2
```

### Register the webhook with Telegram

One curl, once. Telegram will now send all updates to your Worker.

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://beatnonstop-bot.<your-subdomain>.workers.dev/telegram" \
  -d "secret_token=<WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message","message_reaction"]'
```

**Important**: Telegram sends reaction events only if the bot is admin AND you include `message_reaction` in `allowed_updates`. The line above handles it.

### Test

In the group, send `/ping`. Bot should reply `pong · <timestamp>`.

Send `/status`. Bot should show countdown + urgent tasks.

---

## Part 3 — Wire the `/sync` command (2 min)

In the repo root:

```bash
cp .env.sync.example .env.sync
# edit .env.sync with your WORKER_URL and SYNC_API_KEY
```

In Claude Code, type `/sync`. It will read inbox, answer questions, post back to Telegram, update state, commit, push.

---

## Part 4 — Domain (already done) + email

The domain is `beatnonstop.live` (purchased from GoDaddy 2026-04-12). GitHub Pages is wired up. If DNS or HTTPS isn't settled yet, see `setup/godaddy-to-github-pages.md`.

### Optional: move DNS to Cloudflare

For easier future management (plus proxy + email routing in one place):
- Add `beatnonstop.live` to Cloudflare (Add Site → Free plan).
- Cloudflare gives you two name-server values (like `abby.ns.cloudflare.com`).
- At GoDaddy, change the name servers to Cloudflare's. Propagation ~few hours.
- Re-create the GitHub Pages A + AAAA records in Cloudflare DNS (see `setup/godaddy-to-github-pages.md` for the 4 GitHub IPs).

### Email

- Option A (free, receive only): **Cloudflare Email Routing** — forwards `hello@beatnonstop.live` → a personal inbox. Free, ~5 min if DNS is in Cloudflare. Good enough for v1.
- Option B (send outbound): **Resend** free tier (3k emails/mo). Add Resend's DNS records to verify the domain, then the Worker can send via Resend.

For v1, Option A is enough — the system queues outbound drafts for humans to copy-paste until Resend is wired.

---

## Part 5 — How the team uses it

Tell your 3 friends (copy-paste this):

> **Beat Nonstop bot** lives in this group. Here's what you need to know:
>
> - Talk normally in the group. Everything you say is logged, so nothing gets lost.
> - Ask questions freely ("what's our cash gap?"). David runs a sync once a day and the bot posts answers here.
> - Commands you can use anytime: `/status` `/inbox` `/pending` `/help`
> - When the bot posts "🗳 Approval needed", react **👍 to approve** or **👎 to block**. 2 thumbs-up = it happens. Any thumbs-down = it's dropped. David's vote doesn't count (he's the builder).
> - The dashboard with everything: `https://beatnonstop.live/plan.html`

---

## Troubleshooting

- **Bot doesn't reply to `/ping`** → `wrangler tail` to see Worker logs. Most common: webhook not registered (redo Part 2 step "Register the webhook").
- **Bot replies but reactions don't trigger votes** → check bot is admin AND `allowed_updates` includes `message_reaction` (redo the setWebhook curl).
- **State.json edits conflict** → the Worker uses GitHub's sha-based optimistic locking. Conflicts are rare; if you see one in logs, next call will retry. No action needed.
- **`/sync` fails to post** → check `.env.sync` has correct `WORKER_URL` and `SYNC_API_KEY` matching the Worker secret.

---

## What this system does NOT do yet

Intentionally deferred — extension points are clean:

- **Send outbound emails** (needs domain + Resend). Once wired, add a `case "email":` branch in `executeOutboxItem` in `worker/src/index.js`.
- **Shotgun.live sales polling** (needs their API / webhook docs — check once event page is live).
- **Social posting** (marketing team handles it; don't duplicate).

The foundation is complete. Add channels as you need them.
