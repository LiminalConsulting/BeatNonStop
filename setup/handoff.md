# Handoff Guide · Builder → Team

*From the builder (Liminal Consulting) to the three organizers (David, Tiago, Bruno).*

This document describes what the builder owns vs. what the team owns, the credentials to share, and how the day-to-day operation works once handed over.

---

## Principle

**The builder designed the system. The team runs the event.**

The only ongoing dependency the team has on the builder is the `/sync` tick — a daily Claude Code run that processes the Telegram inbox, updates state, and posts back to the group. That tick can be cron-automated so it happens even when the builder is offline.

If something breaks or a new capability is needed, the team messages the Telegram group; the builder picks it up on the next tick.

---

## What the builder owns (keep)

These stay with the builder. They are infrastructure the event leans on but does not directly modify.

| Thing | Why builder keeps it |
|-------|---------------------|
| **GitHub repo** (`LiminalConsulting/BeatNonStop`) | Site + knowledge base + coordination data. Builder pushes code + state updates. |
| **Cloudflare account + Worker** | The always-on "presence" for the Telegram bot. Webhook target. |
| **GitHub Pages deploy** | Builder pushes → Pages rebuilds automatically. Team doesn't need access. |
| **Claude Max subscription** | Powers the `/sync` loop LLM calls. |
| **Domain DNS at GoDaddy (beatnonstop.live)** | Once configured, rarely touched. Builder holds registrar account. |
| **The `/sync` slash command** | Runs via Claude Code on builder's machine (or headless cron). |

---

## What the team owns (receive)

These are handed over to the team with full credentials. They are domain-specific to the event.

| Thing | Who gets it | Credentials to share |
|-------|-------------|---------------------|
| **Shotgun.live organizer account** | David | Login email + password; access to Stripe linked account |
| **Stripe account (payout)** | David | Linked to his personal IBAN; standard Stripe access |
| **Instagram @beatnonstop** | Marketing team + David | Existing access; nothing new to hand over |
| **Telegram group** | Whole team | Bot is a member; organizers are admins |
| **Duas Igrejas parish relationship** | Tiago + David | Not a credential — a relationship. Tiago + David own this. |
| **Vendor relationships** (sound/lights company, security, etc.) | Tiago | Not credentials. Personal relationships. |
| **Cash box and on-night operations** | David + Tiago + Bruno | Physical. Split by role on event day. |

---

## How day-to-day operation works after handoff

### Team flow

1. Something happens (vendor confirms, question from an attendee, budget update, a decision needs to be made).
2. The team writes it in the Telegram group. No special format needed — just a normal message.
3. The Worker logs every message to `data/inbox.md` automatically.
4. Within ~24h, the next `/sync` tick processes the inbox:
   - Answers factual questions directly in the group
   - Updates `data/state.json` with reported facts (the dashboard auto-updates within ~30s of sync)
   - Drafts outbound actions (sponsor emails, press outreach, etc.) and posts them to the group for vote
5. The group votes with 👍 / 👎 reactions:
   - **2 👍 from non-builders** → the action executes
   - **Any 👎** → action drops
6. Dashboard at `beatnonstop.live/plan.html` always shows current state.

### Builder flow

1. Runs `/sync` once a day (or sets up a cron that runs `claude -p /sync` headlessly).
2. Checks that the run completed cleanly (the `/sync` command posts a summary to the group).
3. Occasionally reviews flagged risks or monitoring breaches and pings the team if needed.
4. Monthly: reviews architecture, makes improvements, adds capabilities.

**Rough bandwidth estimate**: 15–30 minutes per week of builder attention in steady state, assuming /sync is automated.

---

## Agentic capabilities available to the team

The coordination system supports these actions, all gated by the 2-of-N vote:

### Already working
- **Ask questions in the group** — the AI answers factually from the knowledge base
- **Report facts** — "Kika confirmed 12:30 arrival" → state updates + reflected on the dashboard
- **Task updates** — "t7 done" → task moves to complete
- **Draft outbound emails** (sponsor pitch, press outreach, artist comms) — AI drafts, team votes, builder's `/sync` dispatches

### Extension points (can be turned on when needed — see `ARCHITECTURE.md`)
- **Outbound email sending** (via Resend, free tier) — blocked until builder enables the domain's DKIM
- **Live Shotgun sales polling** — auto-updates ticket counts on the dashboard
- **Sponsor research + cold outreach** — AI researches prospects, group approves, system sends
- **Voting on agentic proposals** — the AI proposes ideas ("Should I draft a press release for the radio?"), group votes yes/no

None of these are wired up tonight. Adding any of them is a ~30–60 min builder task.

---

## Onboarding checklist for the team

When the builder hands over, walk the team through:

- [ ] Join the Telegram group
- [ ] Receive `/help` from the bot (shows available commands)
- [ ] Bookmark `beatnonstop.live/plan.html` (dashboard)
- [ ] Understand the voting rule (2 👍 execute, any 👎 blocks)
- [ ] Know where the builder is reachable (Telegram DM for emergencies; otherwise the group)
- [ ] David has Shotgun + Stripe logins saved and tested
- [ ] Marketing team has Instagram access confirmed
- [ ] Everyone knows the rhythm: write in the group, check the dashboard, vote on proposals

---

## What to do if something breaks

| Symptom | Action |
|---------|--------|
| Bot stops responding in group | Builder restarts the Cloudflare Worker; usually a 2-min fix |
| Dashboard shows stale data | Check last-commit time; if > 48h old, ping builder |
| Ticket checkout broken on site | Fall back to sharing the direct Shotgun link; builder investigates |
| Disagreement about a decision | Discuss in the group; AI summarizes options; team votes |

---

## Boundaries

- **Builder is not a domain expert.** Don't ask the builder what time a DJ should go on, which sponsor to approach first, or how much to pay for security. Ask the AI via the group, or decide within the team — the builder holds the architecture, not the knowledge.
- **AI is not a legal advisor.** Permits, alcohol licensing, tax, and contracts must be validated by humans (Duas Igrejas, an accountant, etc.).
- **Humans own the relationships.** Artists, parish, municipality, press — these are trust networks that require human presence. The AI helps with preparation, drafting, and memory. It does not substitute for being there.

---

## Contact

- **Builder**: German David (Liminal Consulting). Telegram DM for emergencies.
- **Team lead for money/tickets**: David Pereira
- **Team lead for artists/sound**: Tiago
- **Team lead for operations/production**: Bruno
