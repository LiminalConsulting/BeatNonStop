# Monitoring Rules · Weekly Checks

*The AI planning system watches these and may surface them during /sync.*

## ⚠️ Scope note (2026-04-22)

The thresholds and deadlines below were drafted by an earlier AI session based on a mega-festival (50k+) production timeline. **The team (David, Tiago, Bruno) has NOT explicitly agreed to any of these dates.** This event is ~1–2k people, edition 2 — the operating scale is different.

**How /sync should treat these rules until the team confirms them:**
- **OK to surface as gentle suggestions** ("heads up — this was on the suggested timeline, still want it?"). Ideally ask only once per item, not every tick.
- **Do NOT post as "overdue" / 🔴 / "deadline missed"** unless the team has explicitly committed to that date in the group or in `data/state.json`.
- When in doubt: ask the team ("is this still on your list?") rather than flag.
- When the team says "drop X" / "push Y to [date]" / "this isn't on us", update `data/state.json` and stop surfacing that item.

**Team-committed items** (safe to flag firmly if missed): ticket velocity thresholds below, Shotgun NIPC (t23, David flagged it himself), event date 2026-05-16, cash in/out tracked in state.budget. Everything else → treat as suggestion.

---

## 🎯 Ticket metrics — weekly review

### Primary numbers to track
- **Total tickets sold** (running total)
- **Geral count** vs **Pack Duo count** (each Pack Duo = 2 tickets)
- **Blended average price** (total revenue ÷ total tickets)

### Thresholds and actions

| Condition | Action |
|-----------|--------|
| Total tickets < 100 by Apr 26 | 🟡 Flag: "Sales pace behind plan. Consider boosting marketing push." |
| Total tickets < 250 by May 3 | 🔴 Flag: "Break-even at risk. Review sponsor outreach urgency + marketing spend." |
| Total tickets < 450 by May 10 | 🔴 Flag: "Below minimum break-even trajectory. Talk to artists early about conditional balances." |
| Duo / Geral ratio > 60% Duo by Apr 26 | 🟡 Flag: "Duo dominating mix. Blended avg dropping. Consider a limited premium tier." |
| Blended avg price < €12 | 🟡 Flag: "Revenue per ticket underperforming. Break-even shifts upward." |
| Strong surge (> 400 tickets in week 1) | 🟢 Flag: "Strong demand. Consider adding VIP tier or late premium option." |

### Break-even reference
- **Floor** (deposits only, no artist balances): **475 tickets**
- **Full obligations** (balances + bonuses paid): **577 tickets**
- **Target**: **1000 tickets**

---

## 💰 Cost monitoring

| Item | Baseline | Alert if |
|------|----------|----------|
| Security quote | €800 estimate | Actual > €1,200 — recalculate break-even |
| Equipment balance | €1,500 day-of | Any change from vendor |
| Marketing team output | Weekly posts | Silent > 5 days — prompt David to check in |
| Unplanned expenses | €400 misc budget | Cumulative > €500 mid-event — flag |

### Pre-event cash-flow checkpoints
| Date | Should have paid | Should have in hand |
|------|------------------|---------------------|
| Apr 14 | €500 marketing deposit | €4,500 + incoming ticket revenue |
| Apr 26 | + €725 artist deposits | €3,775 + ticket revenue accumulating |
| May 1 | + €1,500 equipment deposit | Ticket revenue covers remainder |
| May 15 | All pre-event commitments paid | €1,500 reserved for equipment balance day-of |

---

## 🎭 Lineup + artist status

- Artist reveals: one per day Apr 15 → 21 (7 artists)
- If any artist goes silent > 3 days before scheduled reveal → flag
- If an artist drops out → immediate flag + propose backup DJs from Tiago's network

---

## 📅 Permit + legal

| Item | Deadline | Flag if |
|------|----------|---------|
| Event permit via câmara | May 3 | Not confirmed by Apr 26 |
| Insurance coverage verification | Apr 26 | Not confirmed by Apr 20 |
| First aid plan | May 3 | Not resolved by Apr 26 |
| Police notification | May 10 | Not done by May 7 |

---

## 🌦 Weather

From May 10 onward, daily weather check for May 16:
- If > 60% chance of rain on May 16 → 🟡 flag: "Prepare rain contingency comms"
- If severe weather warning → 🔴 flag immediately

---

## 🗓 Daily briefing format (for Telegram bot)

```
🌑 Lua Nova · Day X of Y

📊 Tickets: [N] sold · [Geral/Duo ratio] · €[avg] avg
💰 Cash in: €[X] · Cash committed: €[Y]
✅ Due today: [top 3 tasks]
🚨 Flags: [any threshold breached]
```

---

## Flag log

*New flags appended here with timestamp and resolution.*

### 2026-04-12 · Initial monitoring rules established
Flat pricing committed. Artist balance structure is variable (€1,325 conditional on success). Break-even floor 475 tickets. Watch Duo/Geral mix.

### 2026-04-13 · Tickets live
Shotgun event live, end-to-end test purchase confirmed. Monitoring begins with next /sync tick.
