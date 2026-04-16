# /staging — preview of the **public** site

This folder is a preview of the public event site, served at `beatnonstop.live/staging/`. **Scope: public site only** (`index.html` + its assets). Never the plan dashboard.

**Flow**
1. Team posts feedback / ideas / annotated screenshots in Telegram.
2. Next `/sync` reads inbox → edits files in `/staging/`.
3. Pages rebuilds; staging URL reflects the change within ~1 min.
4. When the team is happy, someone runs `/promote` in Telegram.
5. Bot posts a vote request. 2 👍 (non-builder) → files are copied from `/staging/` to repo root. 👎 blocks.

**Rules**
- Public-site changes → edit in `/staging/` first. Never edit public-site files at repo root directly.
- **Plan dashboard is NOT staged.** Edit `plan.html` at repo root directly — it's an internal tool for 3 people, changes should land live immediately on next `/sync`. Do not copy plan.html into staging.
- `/promote` overwrites root with staging, but explicitly skips `plan.html` and `styles/planning.css` (see `PROMOTE_SKIP_PATHS` in `worker/src/index.js` and the matching list in `scripts/promote-staging.sh`).
- Staging pages get a `noindex` + yellow banner; it's semi-private, not secret.
