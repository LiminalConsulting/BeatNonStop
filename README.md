# Beat Nonstop — Lua Nova

Event: **16 May 2026 · Ribeira do Neiva, Vila Verde, Braga, Portugal**

This repo holds three things:

1. **Public event site** — `index.html` (GitHub Pages)
2. **Private planning dashboard** — `plan.html` (same domain, team-only URL)
3. **Coordination system** — Telegram bot (Cloudflare Worker) + repo-as-database + daily `/sync` slash command funded by Claude Max

## Start here

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the coordination system is wired (read this first if you're new)
- **[SETUP.md](SETUP.md)** — step-by-step bot deployment
- **[CLAUDE.md](CLAUDE.md)** — website redesign instructions
- **[EVENT_SYSTEM_PROMPT.md](EVENT_SYSTEM_PROMPT.md)** — operating framing for Claude sessions
- `knowledge/` — canonical event facts (single source of truth)
- `data/` — live state of the coordination system (inbox, outbox, dashboard state, reminders)

---

## DreamNode context

## Universal Dream Description (UDD)

The `udd.json` file contains the essential metadata for this DreamNode:

```json
{
  "uuid": "Unique identifier (constant)",
  "title": "Display name/title", 
  "type": "dream or dreamer",
  "dreamTalk": "Path to symbolic representation",
  "liminalWebRelationships": ["Connected DreamNode UUIDs"],
  "submodules": ["Child DreamNode UUIDs"],
  "supermodules": ["Parent DreamNode UUIDs"]
}
```

## Relationships

### Liminal Web (Horizontal)
- **Dreams** connect to **Dreamers** who hold them
- **Dreamers** connect to **Dreams** they carry
- Forms the social fabric of shared knowledge

### Holonic Structure (Vertical)  
- **Submodules**: Ideas that are part of this idea
- **Supermodules**: Larger ideas this idea participates in
- Enables fractal knowledge organization

## Coherence Beacons

This DreamNode includes git hooks that maintain relationship coherence:

- **pre-commit**: Integrates external references as submodules
- **post-commit**: Updates bidirectional relationship tracking

Changes propagate through the peer-to-peer network via **Radicle**.

## License

This DreamNode is shared under the **GNU Affero General Public License v3.0** - a strong copyleft license ensuring this knowledge remains free and open for all.

## InterBrain

Part of the **InterBrain** project: transcending personal knowledge management toward collective knowledge gardening.

- **Repository**: https://github.com/ProjectLiminality/InterBrain
- **Vision**: Building DreamOS - a decentralized operating system for collective sensemaking