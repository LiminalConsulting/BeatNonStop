# Transcript

Append-only conversational record. Every group message + every bot reply lands here in order.
Unlike `inbox.md` (which is a work queue cleared by `/sync`), this file is **never cleared** —
`/sync` reads the tail for conversational context: standing preferences, ongoing threads,
prior bot commitments, user-specific tone cues.

Format:

```
[2026-04-14T10:52:45Z] @username: message text
[2026-04-14T10:55:20Z] bot: reply text
```

Media is referenced inline with the same `📷 → path` / `📎 → path` shorthand as inbox.md.

---
