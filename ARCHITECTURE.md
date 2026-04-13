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
 data/inbox.md          ← all group messages queued for LLM processing
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

## Extension points (intentionally deferred)

Clean hooks exist for these — add when needed:

- **Outbound email** (Resend free tier, 3k/mo) — add `case "email":` in `executeOutboxItem`, wire domain DKIM. Blocked until domain purchased.
- **Shotgun.live sales polling** — add a second cron trigger + handler that updates `state.json` ticket counts. Blocked until event page live + Shotgun API reviewed.
- **Calendar awareness, social posting, financial receipt scanning** — explicitly NOT in scope (marketing team handles socials; team doesn't need calendar coordination through the bot).

---

## Philosophy / why this exists

This is a template for agentic behavior funded by a flat-rate LLM subscription rather than per-token API costs. The Worker provides 24/7 presence; the periodic `/sync` provides intelligence. The repo is both the memory and the I/O surface. Anyone with a Claude Max sub can replicate this pattern for any group coordination problem.
