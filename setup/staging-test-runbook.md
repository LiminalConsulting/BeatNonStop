# Staging Pipeline Test · Step-by-Step Runbook

Test the full loop: Telegram message → staging edit → vote → promotion to public.

## Prerequisites

- [ ] Worker deployed and `/ping` works in the Telegram group
- [ ] `.env.sync` is filled (WORKER_URL + SYNC_API_KEY)
- [ ] You are in the group with the bot + at least 2 other humans (David P + one more) so 2 non-builder 👍 is achievable
- [ ] **Bot privacy mode is OFF.** In @BotFather: `/mybots` → pick the bot → Bot Settings → Group Privacy → Turn off. Otherwise photos/documents in group won't reach the Worker.

## Phase 0 · Deploy the upgraded Worker

From the repo root:

```bash
cd worker
./deploy.sh
```

Expected: `✓ Done.` and `/ping` still returns `pong` in the group.

Then commit + push the staging folder + site changes so GitHub Pages serves `/staging/`:

```bash
cd ..
git commit -m "feat: staging pipeline + multimodal inbox + promote voting"
git push origin main
```

Wait ~60 seconds for Pages to rebuild. Then:

1. Open https://beatnonstop.live/staging/ in a browser. Verify:
   - Yellow banner at top: "⚠ STAGING · not public"
   - Site otherwise looks identical to public
2. Open https://beatnonstop.live/ — should look the same, no banner.

If staging 404s, check the repo → Settings → Pages: confirm deploy is "from main branch, / (root)".

## Phase 1 · Test multimodal inbox

Goal: confirm text, photos, and documents all reach `data/inbox.md`.

1. In the Telegram group, send a plain text message: **"test: staging pipeline check"**
2. Send a photo with a caption: **(any photo) + caption "make the hero headline bigger"**
3. Send a screenshot as a document (iPhone: share → Files → then from Files to Telegram). Caption: **"annotate this area"**

Then in Telegram: `/inbox`

Expected preview shows:
- The text message
- `📷 photo → data/inbox-media/...jpg` line with the caption
- `📎 document ... → data/inbox-media/....png` line with the caption

Also check the repo on GitHub — `data/inbox-media/` should have two new files with ISO-timestamped names.

If photos don't show up: bot privacy mode is still on. Fix in @BotFather and re-test.

## Phase 2 · Test staging edit via /sync

Goal: a feedback message in the group results in a visible change at `beatnonstop.live/staging/`.

1. In the group, send: **"on staging, change the hero headline to 'NEW MOON · FULL SOUND' instead of what's there"**
2. On your laptop, in Claude Code, run: `/sync`
3. Watch it:
   - Read the inbox
   - Classify as site feedback
   - Edit `staging/index.html`
   - Commit + push
   - Post a reply to the group: "staging updated — refresh https://beatnonstop.live/staging/"
4. Wait ~60s for Pages rebuild. Refresh the staging URL. Verify the headline changed.
5. Verify https://beatnonstop.live/ is **unchanged** (still old headline).

Do a second round to get the team comfortable:
- Send a screenshot of the staging site with a circled area + caption "make this less tall"
- Run `/sync` again
- Confirm staging updates; public doesn't.

## Phase 3 · Test /promote voting flow

Goal: the team votes → public site updates.

1. In the group, send: `/promote`
2. Bot posts a message like:

   ```
   🗳 Approval needed — promote staging to public
   promote-2026-04-13T...
   Copy /staging/ → public site root · requested by @david
   React 👍 to approve (need 2) · 👎 to block.
   Preview first: https://beatnonstop.live/staging/
   ```

3. Test the **block** path first:
   - Have David P react 👎
   - Bot should reply: `🚫 promote-... blocked by 👎. Dropped.`
   - Nothing changes on public site.

4. Run `/promote` again (new request).

5. Test the **approve** path:
   - Have David P react 👍
   - Have the third person react 👍
   - Bot should reply: `✅ promote-... approved — staging promoted to public.`
   - `N files updated. Pages will rebuild in ~60s.`

6. Wait ~60s. Refresh https://beatnonstop.live/ — should now reflect the staging changes.
7. Refresh https://beatnonstop.live/staging/ — same content, but banner still present (staging meta + banner stay in the staging copy).

**Important**: David (the builder) reacting 👍 does NOT count toward the 2. This is by design — you're the architect, not a decider. To approve, you need two OTHER people.

## Phase 4 · Rollback drill (optional but recommended)

If a promoted change turns out to be wrong:

```bash
git log --oneline -5          # find the "promote: ..." commits
git revert <commit-sha>       # revert the promotion commit(s)
git push origin main
```

Pages rebuilds from the reverted state. Takes ~60s.

This is the safety net. Demonstrate it once so the team knows it exists.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/staging` in chat returns nothing | Bot didn't pick up new command list | Worker needs redeploy: `./worker/deploy.sh` |
| Photos don't appear in inbox | Bot privacy mode still on | @BotFather → bot settings → group privacy → off |
| `/promote` posts but votes don't register | Webhook `allowed_updates` missing `message_reaction` | Re-run deploy.sh (it re-registers the webhook) |
| Staging page broken styling | Relative asset path missing in `/staging/` | `cp <file> staging/` and push |
| `promote_failed: ...` in bot reply | GitHub API rate-limited or PAT scope wrong | Check GITHUB_TOKEN has Contents: write on the repo |
| Public site didn't update after approval | Pages cache / not rebuilt yet | Wait 90s; check Actions tab on GitHub for the Pages build |

## What to tell David P during the test

Script:

> "I'm going to send a message in the group asking to change something on the site. Watch what happens. It goes into this inbox file on GitHub. Then I run one command on my laptop — `/sync` — and the staging site updates in about a minute. You see it at `beatnonstop.live/staging/`. When you're happy with it, you type `/promote` in the group. I react 👍 but it doesn't count. You and the third person react 👍 and it copies staging to the public site. If either of you reacts 👎, nothing happens. That's the whole workflow."

Keep the first demo change small and obviously visible (headline text, a color).
