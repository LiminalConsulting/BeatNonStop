// Beat Nonstop — Lua Nova · Telegram bot on Cloudflare Workers
// Repo = database. All state lives as files in the GitHub repo.
// This Worker:
//   · Receives Telegram updates via webhook
//   · Logs every group message to data/inbox.md (via GitHub API)
//   · Handles slash commands: /status /inbox /pending /help /ping
//   · Tallies 👍/👎 reactions on outbox items (2-of-N voting, builder excluded, any 👎 blocks)
//   · Exposes authed endpoints for the /sync slash command to post replies and queue outbox items
//   · Cron trigger (every 15 min) posts due reminders from data/reminders.json
//
// No frameworks. Plain fetch. Single file by design.

const GH_API = "https://api.github.com";

// ---------- Entry points ----------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/telegram") {
      return handleTelegramWebhook(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/reply") {
      return handleSyncReply(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/outbox") {
      return handleSyncOutbox(request, env);
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok");
    }
    return new Response("not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminderTick(env));
  },
};

// ---------- Telegram webhook ----------

async function handleTelegramWebhook(request, env) {
  // Verify secret header Telegram adds (set when registering the webhook)
  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== env.WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  try {
    if (update.message) {
      await onMessage(update.message, env);
    } else if (update.message_reaction) {
      await onReaction(update.message_reaction, env);
    }
  } catch (err) {
    console.error("telegram handler error:", err && err.stack || err);
  }

  // Telegram expects 200 OK regardless; errors go to logs
  return new Response("ok");
}

async function onMessage(msg, env) {
  const text = (msg.text || msg.caption || "").trim();
  const chatId = msg.chat.id;
  const fromId = msg.from && msg.from.id;
  const username = (msg.from && (msg.from.username || msg.from.first_name)) || "unknown";

  // Only engage in the configured group chat
  if (String(chatId) !== String(env.TELEGRAM_CHAT_ID)) {
    // Allow DMs from builder only for manual ops (optional). Otherwise ignore.
    if (String(fromId) !== String(env.BUILDER_USER_ID)) return;
  }

  // Slash commands (text-only messages)
  if (msg.text && text.startsWith("/")) {
    const cmd = text.split(/\s+/)[0].split("@")[0].toLowerCase();
    if (cmd === "/help" || cmd === "/start") {
      return sendMessage(env, chatId, HELP_TEXT, { reply_to: msg.message_id });
    }
    if (cmd === "/ping") {
      return sendMessage(env, chatId, "pong · " + new Date().toISOString(), { reply_to: msg.message_id });
    }
    if (cmd === "/status") {
      return sendStatus(env, chatId, msg.message_id);
    }
    if (cmd === "/inbox") {
      return sendInboxPreview(env, chatId, msg.message_id);
    }
    if (cmd === "/pending") {
      return sendPendingApprovals(env, chatId, msg.message_id);
    }
    if (cmd === "/staging") {
      return sendStagingInfo(env, chatId, msg.message_id);
    }
    if (cmd === "/promote") {
      return queuePromotion(env, chatId, msg.message_id, username, fromId);
    }
    // Unknown command — ignore silently
    return;
  }

  // Non-command message. Handle media if present; always log to inbox.
  const mediaNotes = [];

  // Photo: Telegram sends an array of sizes; take the largest.
  if (msg.photo && msg.photo.length) {
    const largest = msg.photo[msg.photo.length - 1];
    try {
      const saved = await saveTelegramFile(env, largest.file_id, "photo", "jpg");
      mediaNotes.push(`📷 photo → \`${saved.path}\``);
    } catch (e) {
      mediaNotes.push(`📷 photo (save failed: ${e.message})`);
    }
  }

  // Document (includes screenshots sent as files, PDFs, etc.)
  if (msg.document) {
    const doc = msg.document;
    const ext = (doc.file_name && doc.file_name.includes(".")) ? doc.file_name.split(".").pop() : "bin";
    try {
      const saved = await saveTelegramFile(env, doc.file_id, "doc", ext);
      mediaNotes.push(`📎 document \`${doc.file_name || "(unnamed)"}\` → \`${saved.path}\``);
    } catch (e) {
      mediaNotes.push(`📎 document (save failed: ${e.message})`);
    }
  }

  // Ignore videos / voice / stickers / animations for now — note their presence.
  if (msg.video) mediaNotes.push(`🎬 video (not ingested in v1)`);
  if (msg.voice) mediaNotes.push(`🎤 voice memo (not ingested in v1)`);

  // If nothing to log (e.g. empty reaction edit), bail.
  if (!text && mediaNotes.length === 0) return;

  await appendInbox(env, {
    ts: new Date().toISOString(),
    username,
    from_id: fromId,
    text,
    media: mediaNotes,
  });
}

async function onReaction(reaction, env) {
  // reaction = { chat, message_id, user, old_reaction, new_reaction }
  const chatId = reaction.chat.id;
  if (String(chatId) !== String(env.TELEGRAM_CHAT_ID)) return;

  const userId = reaction.user && reaction.user.id;
  const messageId = reaction.message_id;
  const newEmojis = (reaction.new_reaction || []).map(r => r.emoji || "").filter(Boolean);

  // Find outbox item by telegram message id
  const { data: outbox, sha } = await getJson(env, "data/outbox.json");
  const item = (outbox.pending || []).find(p => p.telegram_message_id === messageId);
  if (!item) return; // reaction on non-outbox message — ignore

  const { data: approvals, sha: appSha } = await getJson(env, "data/approvals.json");
  approvals.votes = approvals.votes || {};
  const record = approvals.votes[item.id] || { up: [], down: [] };

  // Clear this user from prior arrays; add them based on current reaction
  record.up = record.up.filter(id => id !== userId);
  record.down = record.down.filter(id => id !== userId);
  const hasThumbUp = newEmojis.includes("👍");
  const hasThumbDown = newEmojis.includes("👎");
  if (hasThumbUp) record.up.push(userId);
  if (hasThumbDown) record.down.push(userId);
  approvals.votes[item.id] = record;

  // Builder (David) is excluded from quorum
  const builderId = Number(env.BUILDER_USER_ID);
  const countingUp = record.up.filter(id => id !== builderId);
  const countingDown = record.down.filter(id => id !== builderId);
  const threshold = Number(env.APPROVAL_THRESHOLD || 2);

  let decision = null;
  if (countingDown.length > 0) decision = "rejected";
  else if (countingUp.length >= threshold) decision = "approved";

  await putJson(env, "data/approvals.json", approvals, appSha,
    `vote: ${item.id} up=${countingUp.length} down=${countingDown.length}`);

  if (decision === "approved") {
    await executeOutboxItem(env, item);
  } else if (decision === "rejected") {
    await rejectOutboxItem(env, item, userId);
  }
}

// ---------- Commands ----------

const HELP_TEXT = [
  "🇬🇧 Beat Nonstop bot — commands:",
  "",
  "/status — event countdown + top open tasks",
  "/inbox — what's queued for David's next /sync",
  "/pending — items waiting for 👍 votes",
  "/staging — show the staging site URL",
  "/promote — queue: copy staging → public (needs 2 👍)",
  "/help — this message",
  "",
  "Messages + photos + documents are logged to the inbox so nothing gets lost.",
  "Voting: any 👎 blocks. 2 👍 from team members execute (David excluded).",
  "",
  "—",
  "",
  "🇵🇹 Bot Beat Nonstop — comandos:",
  "",
  "/status — contagem decrescente + tarefas abertas principais",
  "/inbox — mensagens em fila para o próximo /sync do David",
  "/pending — itens à espera de 👍",
  "/staging — mostra o URL do site de staging",
  "/promote — pede votação: copiar staging → público (precisa de 2 👍)",
  "/help — esta mensagem",
  "",
  "Mensagens, fotos e documentos ficam guardados no inbox — nada se perde.",
  "Votação: qualquer 👎 bloqueia. 2 👍 da equipa executam (David não conta).",
].join("\n");

async function sendStatus(env, chatId, replyTo) {
  const { data: state } = await getJson(env, "data/state.json");
  const eventDate = new Date(state.meta.event_date);
  const now = new Date();
  const days = Math.ceil((eventDate - now) / 86400000);

  const open = (state.tasks || []).filter(t => t.status === "open");
  const urgent = open.filter(t => t.priority === "urgent").slice(0, 5);
  const high = open.filter(t => t.priority === "high").slice(0, 5);

  const lines = [
    `🌑 *${state.meta.event_name}*`,
    `${days} days to event · ${state.meta.venue.split(",")[0]}`,
    ``,
    `Tickets: ${state.tickets.sold}/${state.tickets.target_sales} · launch ${state.tickets.launch_date}`,
    `Cash: €${state.budget.cash_in_hand} in hand · gap €${state.budget.cash_gap}`,
    ``,
  ];
  if (urgent.length) {
    lines.push(`🚨 *Urgent*`);
    urgent.forEach(t => lines.push(`· ${t.title} _(${t.owner})_`));
    lines.push("");
  }
  if (high.length) {
    lines.push(`🔴 *High*`);
    high.forEach(t => lines.push(`· ${t.title} _(${t.owner})_`));
  }
  return sendMessage(env, chatId, lines.join("\n"), { reply_to: replyTo, parse_mode: "Markdown" });
}

async function sendInboxPreview(env, chatId, replyTo) {
  const content = await getFile(env, "data/inbox.md");
  const lines = content.text.split("\n").filter(l => l.trim()).slice(-20);
  const body = lines.length ? lines.join("\n") : "Inbox empty.";
  return sendMessage(env, chatId,
    "📥 Inbox (last 20 lines):\n\n" + body.slice(0, 3500),
    { reply_to: replyTo });
}

async function sendStagingInfo(env, chatId, replyTo) {
  const lines = [
    "🛠 *Staging site*",
    "",
    "Preview: https://beatnonstop.live/staging/",
    "Plan (staging): https://beatnonstop.live/staging/plan.html",
    "",
    "Team writes feedback in this group → next /sync edits the staging folder → refresh the URL to see it.",
    "When happy, run /promote — needs 2 👍 to copy staging over the public site.",
  ].join("\n");
  return sendMessage(env, chatId, lines, { reply_to: replyTo, parse_mode: "Markdown" });
}

async function queuePromotion(env, chatId, replyTo, username, fromId) {
  const id = "promote-" + new Date().toISOString().replace(/[:.]/g, "-");
  const item = {
    id,
    kind: "promote_staging",
    summary: `Copy /staging/ → public site root · requested by @${username}`,
    action: { type: "promote_staging", payload: { requested_by: username, requested_by_id: fromId } },
  };
  const voteText = [
    `🗳 *Approval needed — promote staging to public*`,
    `*${id}*`,
    ``,
    item.summary,
    ``,
    `React 👍 to approve (need ${env.APPROVAL_THRESHOLD || 2}) · 👎 to block.`,
    `Preview first: https://beatnonstop.live/staging/`,
  ].join("\n");
  const sent = await sendMessage(env, chatId, voteText, { parse_mode: "Markdown" });

  const { data: outbox, sha } = await getJson(env, "data/outbox.json");
  outbox.pending = outbox.pending || [];
  outbox.pending.push({
    ...item,
    telegram_message_id: sent.message_id,
    created_at: new Date().toISOString(),
  });
  await putJson(env, "data/outbox.json", outbox, sha, `outbox: queue ${id}`);
}

async function sendPendingApprovals(env, chatId, replyTo) {
  const { data: outbox } = await getJson(env, "data/outbox.json");
  const pending = outbox.pending || [];
  if (!pending.length) {
    return sendMessage(env, chatId, "Nothing pending approval.", { reply_to: replyTo });
  }
  const lines = ["🗳 *Pending approvals* (react 👍 to approve · 👎 to block)", ""];
  pending.forEach(p => {
    lines.push(`*${p.id}* — ${p.kind}`);
    lines.push(p.summary);
    lines.push("");
  });
  return sendMessage(env, chatId, lines.join("\n"), { reply_to: replyTo, parse_mode: "Markdown" });
}

// ---------- Authed endpoints (for /sync slash command) ----------

function checkAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  return auth === `Bearer ${env.SYNC_API_KEY}`;
}

async function handleSyncReply(request, env) {
  if (!checkAuth(request, env)) return new Response("forbidden", { status: 403 });
  const { text, parse_mode } = await request.json();
  if (!text) return new Response("text required", { status: 400 });
  const res = await sendMessage(env, env.TELEGRAM_CHAT_ID, text, { parse_mode: parse_mode || "Markdown" });
  // Record bot's own turn in the transcript so /sync can see what it previously said
  const ts = new Date().toISOString();
  await appendTranscript(env, `[${ts}] bot: ${text}`, "transcript: bot reply");
  return new Response(JSON.stringify({ ok: true, message_id: res.message_id }), {
    headers: { "content-type": "application/json" },
  });
}

async function handleSyncOutbox(request, env) {
  if (!checkAuth(request, env)) return new Response("forbidden", { status: 403 });
  const item = await request.json();
  // item: { id, kind, summary, action: { type, payload } }
  if (!item.id || !item.kind || !item.summary || !item.action) {
    return new Response("id, kind, summary, action required", { status: 400 });
  }

  // Post to group for voting
  const voteText = [
    `🗳 *Approval needed*`,
    `*${item.id}* — ${item.kind}`,
    ``,
    item.summary,
    ``,
    `React 👍 to approve (need ${env.APPROVAL_THRESHOLD || 2}) · 👎 to block.`,
  ].join("\n");
  const sent = await sendMessage(env, env.TELEGRAM_CHAT_ID, voteText, { parse_mode: "Markdown" });

  // Persist to outbox.json
  const { data: outbox, sha } = await getJson(env, "data/outbox.json");
  outbox.pending = outbox.pending || [];
  outbox.pending.push({
    ...item,
    telegram_message_id: sent.message_id,
    created_at: new Date().toISOString(),
  });
  await putJson(env, "data/outbox.json", outbox, sha, `outbox: queue ${item.id}`);

  return new Response(JSON.stringify({ ok: true, telegram_message_id: sent.message_id }), {
    headers: { "content-type": "application/json" },
  });
}

// ---------- Outbox execution ----------

async function executeOutboxItem(env, item) {
  // Dispatch on action type. Default (no handler): record as queued for human / next /sync.
  const actionType = item.action && item.action.type;

  let result = "queued_for_human_send";
  let notifyText = `✅ *${item.id}* approved. Action recorded for the next /sync to execute (or human send).`;

  if (actionType === "promote_staging") {
    try {
      const summary = await promoteStagingToRoot(env);
      result = `promoted: ${summary.copied} files copied, ${summary.skipped} skipped`;
      notifyText = [
        `✅ *${item.id}* approved — *staging promoted to public.*`,
        `${summary.copied} files updated. Pages will rebuild in ~60s.`,
        `Live: https://beatnonstop.live/`,
      ].join("\n");
    } catch (e) {
      result = `promote_failed: ${e.message}`;
      notifyText = `⚠ *${item.id}* approved but promotion failed: ${e.message}`;
    }
  }

  const { data: outbox, sha } = await getJson(env, "data/outbox.json");
  outbox.pending = (outbox.pending || []).filter(p => p.id !== item.id);
  outbox.executed = outbox.executed || [];
  outbox.executed.push({ ...item, executed_at: new Date().toISOString(), result });
  await putJson(env, "data/outbox.json", outbox, sha, `outbox: approve ${item.id}`);

  await sendMessage(env, env.TELEGRAM_CHAT_ID, notifyText, { parse_mode: "Markdown" });
}

// Copy every file under /staging/ to the repo root (overwriting), except README.md and the folder itself.
async function promoteStagingToRoot(env) {
  const files = await listRepoTree(env, "staging");
  let copied = 0, skipped = 0;
  for (const f of files) {
    // Skip the staging readme and any nested READMEs we don't want at root
    if (f.path === "staging/README.md") { skipped++; continue; }
    const destPath = f.path.replace(/^staging\//, "");
    // Fetch source (raw bytes — may be binary)
    const src = await getFileRaw(env, f.path);
    // Fetch existing dest sha (if any) for update
    let destSha = undefined;
    try {
      const head = await ghMetaSha(env, destPath);
      destSha = head;
    } catch { /* new file */ }
    await putFileRaw(env, destPath, src.contentB64, destSha, `promote: ${destPath}`);
    copied++;
  }
  return { copied, skipped };
}

async function rejectOutboxItem(env, item, byUserId) {
  const { data: outbox, sha } = await getJson(env, "data/outbox.json");
  outbox.pending = (outbox.pending || []).filter(p => p.id !== item.id);
  outbox.rejected = outbox.rejected || [];
  outbox.rejected.push({ ...item, rejected_at: new Date().toISOString(), rejected_by: byUserId });
  await putJson(env, "data/outbox.json", outbox, sha, `outbox: reject ${item.id}`);

  await sendMessage(env, env.TELEGRAM_CHAT_ID,
    `🚫 *${item.id}* blocked by 👎. Dropped.`,
    { parse_mode: "Markdown" });
}

// ---------- Cron: reminders ----------

async function runReminderTick(env) {
  const { data: reminders, sha } = await getJson(env, "data/reminders.json");
  const now = Date.now();
  let changed = false;
  for (const r of reminders.reminders || []) {
    if (r.posted) continue;
    if (new Date(r.at).getTime() <= now) {
      await sendMessage(env, env.TELEGRAM_CHAT_ID, r.text);
      r.posted = true;
      r.posted_at = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) {
    await putJson(env, "data/reminders.json", reminders, sha, "reminders: mark posted");
  }
}

// ---------- Telegram helpers ----------

async function sendMessage(env, chatId, text, opts = {}) {
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (opts.parse_mode) body.parse_mode = opts.parse_mode;
  if (opts.reply_to) body.reply_to_message_id = opts.reply_to;
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error("telegram sendMessage failed:", JSON.stringify(json));
    return {};
  }
  return json.result;
}

// ---------- GitHub repo-as-database helpers ----------

async function ghHeaders(env) {
  return {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "beatnonstop-bot",
  };
}

async function getFile(env, path) {
  const res = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/contents/${path}`, {
    headers: await ghHeaders(env),
  });
  if (!res.ok) throw new Error(`getFile ${path} failed: ${res.status}`);
  const json = await res.json();
  // GitHub returns base64 of the UTF-8 bytes. atob() gives Latin-1 string; decode as UTF-8.
  const bin = atob(json.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const text = new TextDecoder("utf-8").decode(bytes);
  return { text, sha: json.sha };
}

async function putFile(env, path, text, sha, message) {
  // Encode as UTF-8 → base64. Avoid the legacy unescape/encodeURIComponent chain.
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const content = btoa(bin);
  const body = { message, content, sha };
  const res = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...(await ghHeaders(env)), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`putFile ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function getJson(env, path) {
  const { text, sha } = await getFile(env, path);
  return { data: JSON.parse(text), sha };
}

async function putJson(env, path, data, sha, message) {
  return putFile(env, path, JSON.stringify(data, null, 2) + "\n", sha, message);
}

async function appendInbox(env, entry) {
  const { text, sha } = await getFile(env, "data/inbox.md");
  const lines = [
    ``,
    `## ${entry.ts} — @${entry.username} (${entry.from_id})`,
  ];
  if (entry.text) lines.push(entry.text);
  if (entry.media && entry.media.length) {
    lines.push("");
    for (const m of entry.media) lines.push(m);
  }
  lines.push(`---`, ``);
  await putFile(env, "data/inbox.md", text + lines.join("\n"), sha, `inbox: @${entry.username}`);

  // Also append to the permanent transcript (never cleared — provides /sync with conversational history)
  const tLines = [];
  const header = `[${entry.ts}] @${entry.username}:`;
  if (entry.text) {
    tLines.push(`${header} ${entry.text}`);
  } else if (entry.media && entry.media.length) {
    tLines.push(header);
  }
  if (entry.media && entry.media.length) {
    for (const m of entry.media) tLines.push(`  ${m}`);
  }
  await appendTranscript(env, tLines.join("\n"), `transcript: @${entry.username}`);
}

// Append a single block (one or multiple lines) to data/transcript.md. Never cleared.
async function appendTranscript(env, block, commitMsg) {
  try {
    const { text, sha } = await getFile(env, "data/transcript.md");
    await putFile(env, "data/transcript.md", text + block + "\n", sha, commitMsg);
  } catch (e) {
    // Don't let transcript failure block the main message flow — log and move on.
    console.error("appendTranscript failed:", e && e.message || e);
  }
}

// ---------- Media ingestion ----------

// Download a Telegram file by file_id and store it in data/inbox-media/<timestamp>-<kind>.<ext>
async function saveTelegramFile(env, fileId, kind, ext) {
  // 1. Resolve file path via Telegram getFile
  const meta = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`).then(r => r.json());
  if (!meta.ok) throw new Error("getFile failed: " + JSON.stringify(meta));
  const tgPath = meta.result.file_path;

  // 2. Download bytes (cap ~5 MB — repo-as-DB isn't for heavy media)
  const MAX_BYTES = 5 * 1024 * 1024;
  if (meta.result.file_size && meta.result.file_size > MAX_BYTES) {
    throw new Error(`file too large (${meta.result.file_size} bytes, max ${MAX_BYTES})`);
  }
  const fileRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${tgPath}`);
  if (!fileRes.ok) throw new Error("download failed: " + fileRes.status);
  const buf = new Uint8Array(await fileRes.arrayBuffer());

  // 3. Base64-encode and commit to repo
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode.apply(null, buf.subarray(i, i + chunk));
  }
  const contentB64 = btoa(bin);

  const safeExt = (ext || "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "bin";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `data/inbox-media/${stamp}-${kind}-${fileId.slice(-8)}.${safeExt}`;

  await putFileRaw(env, path, contentB64, undefined, `inbox-media: ${kind}`);
  return { path };
}

// ---------- Repo tree / raw file helpers ----------

async function listRepoTree(env, prefix) {
  // Get the default branch's tree recursively, filter by prefix.
  const repoMeta = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}`, { headers: await ghHeaders(env) }).then(r => r.json());
  const branch = repoMeta.default_branch || "main";
  const branchMeta = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/branches/${branch}`, { headers: await ghHeaders(env) }).then(r => r.json());
  const sha = branchMeta.commit && branchMeta.commit.sha;
  if (!sha) throw new Error("cannot resolve branch head");
  const tree = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/git/trees/${sha}?recursive=1`, { headers: await ghHeaders(env) }).then(r => r.json());
  return (tree.tree || []).filter(n => n.type === "blob" && n.path.startsWith(prefix + "/"));
}

async function getFileRaw(env, path) {
  const res = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/contents/${path}`, { headers: await ghHeaders(env) });
  if (!res.ok) throw new Error(`getFileRaw ${path} failed: ${res.status}`);
  const json = await res.json();
  return { contentB64: (json.content || "").replace(/\n/g, ""), sha: json.sha };
}

async function ghMetaSha(env, path) {
  const res = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/contents/${path}`, { headers: await ghHeaders(env) });
  if (!res.ok) throw new Error(`meta ${path}: ${res.status}`);
  const json = await res.json();
  return json.sha;
}

async function putFileRaw(env, path, contentB64, sha, message) {
  const body = { message, content: contentB64 };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH_API}/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...(await ghHeaders(env)), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`putFileRaw ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}
