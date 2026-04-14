# Beat Nonstop — System Architecture

> **For any future Claude Code session or collaborator**: this is the map. Read this first. Everything below is derivable from the repo alone.

## What this repo contains

Three layers, one repo:

1. **Public event site** — `index.html` + `assets/` + `styles/` + `js/`. Static GitHub Pages. Aimed at attendees.
2. **Private planning dashboard** — `plan.html`. Same domain, different path. Aimed at the 3-person core team.
3. **Coordination system** — Telegram bot (Cloudflare Worker) + repo-as-database + daily `/sync` slash command. Aimed at keeping the team aligned between meetings.

The coordination system is the non-obvious part. The rest of this doc is about it.

---

## The coordination system (bot + sync + dashboard)

### Design constraint

The 3 organizers are non-technical. They live in Telegram. They need agentic behavior (reminders, answers, sponsor outreach drafts) but David cannot burn per-token API costs — he has a **Claude Max subscription** and wants that to fund all LLM work.

### Solution: split "brain" from "presence"

- **Presence** (always on, no LLM) — Cloudflare Worker. Webhook-driven. Handles commands, logs messages, tallies votes, fires scheduled reminders.
- **Brain** (LLM inference, intermittent) — David runs `/sync` in Claude Code once a day. This is where every LLM call happens. Funded by Max subscription.
- **Database** — the Git repo itself. `data/*.json` and `data/*.md` are source of truth. The Worker reads/writes via GitHub Contents API. The dashboard fetches the same files live. Zero external DB.

### Data flow

```
 Telegram group
      │
      │  messages, /commands, 👍/👎 reactions
      ▼
 Cloudflare Worker (worker/src/index.js)
      │  reads/writes via GitHub API
      ▼
 data/inbox.md          ← group messages queued for LLM processing (cleared each /sync)
 data/transcript.md     ← permanent append-only chat log (humans + bot replies; never cleared)
 data/outbox.json       ← outbound actions awaiting 2-of-N approval
 data/approvals.json    ← vote tally per outbox item
 data/state.json        ← live dashboard state (tasks, budget, tickets, sponsors)
 data/reminders.json    ← scheduled bot messages (cron every 15 min)
      ▲
      │  reads (plan.html) + writes (/sync)
      │
 Claude Code on David's laptop
      │  runs `.claude/commands/sync.md` once/day
      │  POSTs to Worker's /api/reply and /api/outbox
      ▼
 Telegram group (replies + approval requests)
```

### The voting rule

Any outbound action (sponsor email, press outreach, vendor commitment) is queued by `/sync` into `data/outbox.json` and posted to the group via the Worker's `/api/outbox` endpoint. The group votes with reactions:

- **2 distinct 👍** (excluding David's vote — he's builder, not decider) → executes
- **Any 👎** → blocks and drops

Threshold is configurable via the `APPROVAL_THRESHOLD` Worker secret.

### What the Worker does NOT do

- No LLM inference. It's pure routing, logging, and vote tallying.
- No direct outbound (email, social). Extension points are marked in `executeOutboxItem` — add `case "email":` when Resend is wired up.

### What `/sync` does

Defined in `.claude/commands/sync.md`. One command, full loop:

1. Read `data/inbox.md` + `data/outbox.json` + `data/state.json` + `knowledge/`
2. Classify each inbox entry (question / info update / proposal / noise)
3. Answer questions → POST to Worker `/api/reply`
4. Update state from reported facts → edit `data/state.json`
5. Clear processed inbox entries (git history preserves them)
6. Draft outbound actions → POST to Worker `/api/outbox` for voting
7. Draft artifacts for already-approved outbox items into `generated/comms/`
8. Post status summary to group
9. `git commit && git push` — dashboard auto-updates within ~30s

### Auto-sync daemon (added April 2026)

`/sync` no longer requires David to be at the terminal. A `launchd` agent on his Mac polls `origin/main` every 120s; when the Worker has pushed new commits (i.e. fresh inbox entries), it runs `claude -p "/sync"` headlessly using the Max subscription (no API key, no per-token cost).

**Files:**
- `scripts/sync-daemon.sh` — fetch + diff `@` vs `@{u}`; if behind, run `claude -p "/sync" --permission-mode acceptEdits`. Logs to `~/.beatnonstop-sync.log` only when sync actually fires.
- `~/Library/LaunchAgents/live.beatnonstop.sync.plist` — launchd config. `StartInterval=120`, `RunAtLoad=true`. Survives reboots, auto-loads at login. **Not in repo** (machine-local; see `scripts/sync-daemon.plist.example` for the template).

**Manage it:**
```bash
launchctl list | grep beatnonstop                                      # status
launchctl unload ~/Library/LaunchAgents/live.beatnonstop.sync.plist   # stop
launchctl load   ~/Library/LaunchAgents/live.beatnonstop.sync.plist   # start
tail -f ~/.beatnonstop-sync.log                                        # watch
/Users/davidrug/RealDealVault/BeatNonStop/scripts/sync-daemon.sh       # run once manually
```

**Caveats:**
- Mac must be awake — launchd timers pause during sleep, fire on first wake.
- Two `/sync` runs cannot overlap safely (both would push). If a `/sync` ever takes >120s consistently, wrap the script in `flock -n /tmp/bns-sync.lock` to skip overlapping ticks.
- Tool calls inside `/sync` (bash for git push, curl to Worker) must be allow-listed in `.claude/settings.json` — otherwise headless mode hangs waiting for permission. `--permission-mode acceptEdits` covers file writes only.
- If the daemon stops firing: check `~/.beatnonstop-sync.stderr.log` (launchd's own errors) before the app log.
- The `git pull --rebase` inside `/sync` itself handles the case where the daemon and a manual `/sync` race — last writer wins via rebase.

**Disable temporarily** (e.g., during a manual editing session): `launchctl unload …plist`. Re-enable with `load`.

---

## File map

```
/
├── index.html                    public event site
├── plan.html                     private team dashboard (reads data/*.json live)
├── styles/, js/, assets/         site frontend
│
├── data/                         COORDINATION SYSTEM DATABASE
│   ├── state.json                live dashboard state (tasks, budget, tickets, sponsors, artists)
│   ├── inbox.md                  group messages queued for next /sync
│   ├── outbox.json               outbound actions: pending (awaiting vote) / executed / rejected
│   ├── approvals.json            vote tallies per outbox item
│   └── reminders.json            scheduled reminders (Worker cron reads this)
│
├── worker/                       CLOUDFLARE WORKER (the "presence" layer)
│   ├── src/index.js              single-file Worker — webhook, commands, votes, cron, auth'd API
│   ├── wrangler.toml             deploy config + cron trigger (every 15 min) + secrets list
│   └── package.json              dev dep: wrangler
│
├── .claude/commands/
│   └── sync.md                   THE BRAIN TICK — full daily loop spec
│
├── knowledge/                    CANONICAL PROJECT MEMORY (pre-existed this system)
│   ├── event-facts.json          single source of truth for all event details
│   ├── team.json, budget.json, vendors.json
│   ├── open-questions.md, risks.md, decisions.md, timeline.md
│
├── generated/                    outputs from /sync — email drafts, posts, press releases
│   └── comms/                    (created as needed)
│
├── CLAUDE.md                     website design instructions (PHASES 1–8)
├── EVENT_SYSTEM_PROMPT.md        operating modes for Claude (interview/planning/execution)
├── ARCHITECTURE.md               THIS FILE — coordination system map
├── SETUP.md                      step-by-step bot deployment guide
│
├── .env.sync.example             template for /sync command credentials
├── .secrets.local                LOCAL ONLY, gitignored — generated secrets + slots to fill
└── .gitignore                    excludes .env.sync, .secrets.local, node_modules, etc.
```

---

## Setup state (as of last commit)

If you're a future Claude opening this repo, check which of these are done:

- [ ] Cloudflare account exists + `npx wrangler login` done (check `~/.wrangler/config/default.toml` exists)
- [ ] Telegram bot created via @BotFather (token in `.secrets.local`)
- [ ] Telegram group created + bot promoted to admin
- [ ] `TELEGRAM_CHAT_ID` + `BUILDER_USER_ID` captured into `.secrets.local`
- [ ] GitHub fine-grained PAT created with Contents: write on this repo
- [ ] All 8 Worker secrets pushed via `wrangler secret put ...`
- [ ] Worker deployed (`wrangler deploy` from `worker/` dir)
- [ ] Telegram webhook registered (setWebhook curl with `message_reaction` in `allowed_updates`)
- [ ] `.env.sync` created from `.env.sync.example` and filled
- [ ] `/ping` in group returns `pong` → everything works

Full setup instructions: see `SETUP.md`.

---

## The 8 Worker secrets

These are the full list. `wrangler.toml` has comments documenting them, but here for quick reference:

| Secret | Source |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather after `/newbot` |
| `TELEGRAM_CHAT_ID` | `getUpdates` response after sending a msg in the group |
| `WEBHOOK_SECRET` | random 32-byte hex — `openssl rand -hex 32` — stored in `.secrets.local` |
| `SYNC_API_KEY` | random 32-byte hex — `openssl rand -hex 32` — stored in `.secrets.local` |
| `GITHUB_TOKEN` | fine-grained PAT, Contents: read+write on `LiminalConsulting/BeatNonStop` |
| `GITHUB_REPO` | `LiminalConsulting/BeatNonStop` |
| `BUILDER_USER_ID` | David's Telegram user id (from @userinfobot) — excluded from vote quorum |
| `APPROVAL_THRESHOLD` | `2` (how many distinct 👍 execute an outbox item) |

---

## Staging pipeline (added April 2026)

A `/staging/` folder sits alongside the public site at repo root. GitHub Pages serves it at `beatnonstop.live/staging/` automatically (it's just a subdirectory).

**Flow**:
1. Team writes feedback (text / photos / screenshots) in the group
2. Worker logs to `data/inbox.md`; photos + documents land in `data/inbox-media/`
3. Next `/sync` edits files under `staging/` (never root)
4. Pages rebuilds; team previews at `/staging/`
5. When happy, someone runs `/promote` in the group
6. Bot queues an outbox item with `action.type: "promote_staging"`
7. 2 non-builder 👍 → `executeOutboxItem` copies every file under `staging/` to repo root via GitHub Contents API
8. Pages rebuilds public site

Rules:
- `/staging/README.md` is skipped during promotion
- Promotion is a full copy, not a diff — if someone edits root directly while staging is pending, root edits are overwritten
- Staging pages carry `noindex` + a yellow banner; not secret, just semi-private

**Alternative considered**: Cloudflare Pages with per-branch preview URLs. Cleaner long-term but requires migrating off GitHub Pages and teaches the team branches. Deferred. Current folder-based model is ~5 min of plumbing vs. ~half-day migration.

## Multimodal inbox (added April 2026)

`onMessage` now handles:
- `msg.text` → logged as text (unchanged)
- `msg.photo` → largest size downloaded via Telegram `getFile` → saved to `data/inbox-media/<timestamp>-photo-<id>.jpg` → referenced in inbox as `📷 photo → <path>`
- `msg.document` → saved with original extension → referenced as `📎 document <name> → <path>`
- `msg.caption` → used as the text portion when media is present
- `msg.video` / `msg.voice` → noted in inbox but NOT downloaded (deferred)

Size cap: 5 MB per file (GitHub Contents API is not for heavy media; move to R2 if needed later).

`/sync` reads image files directly — Claude is natively multimodal for images, so annotated screenshots are understood without a vision API.

**Requires**: bot privacy mode OFF in @BotFather. Otherwise non-command messages don't reach the Worker in groups.

## Extension points (intentionally deferred)

Clean hooks exist for these — add when needed:

- **Outbound email** (Resend free tier, 3k/mo) — add `case "email":` in `executeOutboxItem`, wire domain DKIM. Blocked until domain purchased.
- **Shotgun.live sales polling** — add a second cron trigger + handler that updates `state.json` ticket counts. Blocked until event page live + Shotgun API reviewed.
- **Calendar awareness, social posting, financial receipt scanning** — explicitly NOT in scope (marketing team handles socials; team doesn't need calendar coordination through the bot).

---

## Philosophy / why this exists

This is a template for agentic behavior funded by a flat-rate LLM subscription rather than per-token API costs. The Worker provides 24/7 presence; the periodic `/sync` provides intelligence. The repo is both the memory and the I/O surface. Anyone with a Claude Max sub can replicate this pattern for any group coordination problem.
