# /staging — preview of the public site

This folder is a full copy of the public site, served at `beatnonstop.live/staging/`.

**Flow**
1. Team posts feedback / ideas / annotated screenshots in Telegram.
2. Next `/sync` reads inbox → edits files in `/staging/`.
3. Pages rebuilds; staging URL reflects the change within ~1 min.
4. When the team is happy, someone runs `/promote` in Telegram.
5. Bot posts a vote request. 2 👍 (non-builder) → files are copied from `/staging/` to repo root. 👎 blocks.

**Rules**
- Never edit files at repo root directly. Always edit in `/staging/` first.
- `/promote` overwrites root with staging — it's a full folder copy, not a diff.
- Staging is `noindex`'d and has a yellow banner; it's semi-private, not secret.
