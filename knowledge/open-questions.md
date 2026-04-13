# Open Questions & Pending Info

*Anything the team still needs to answer. Resolved items move to `decisions.md`.*

---

## 🔴 High — This week

- [ ] Event permit application submitted via Duas Igrejas
- [ ] Stage arrangement confirmed with municipality president
- [ ] Mobile toilets (Dixies) confirmed with municipality
- [ ] Security company formal quote received + signed
- [ ] Insurance coverage verified via parish
- [ ] First aid plan resolved (volunteer vs. contracted paramedic)

---

## 🟡 Medium — Next 2 weeks

- [ ] Poster (Cartache) design finalised
- [ ] Set order / performance times for the 7 artists
- [ ] Door staff identified (trusted friend)
- [ ] Wristband sourcing (2 colours: adult + 13–17)
- [ ] Parent consent form printed (~50 copies)
- [ ] Local press contact list with names + emails
- [ ] Sponsor outreach list (local businesses in Braga / Vila Verde)
- [ ] VIP table configuration (depends on stage vendor platforms)
- [ ] T-shirt pack launch decision

---

## 🟢 Low — Nice to resolve before event

- [ ] Community channel plan for future editions (WhatsApp / Telegram broadcast)
- [ ] Drug harm-reduction resources
- [ ] Accessibility: confirm field is navigable for mobility-limited attendees
- [ ] Content-capture shot list for marketing team

---

## AI research still open

- [ ] Optimal safe attendee ceiling for the venue
- [ ] Portuguese event permit specifics for outdoor events in Vila Verde câmara
- [ ] Industry-standard set scheduling for rapper + DJ hybrid lineups
- [ ] Local sponsorship prospect list (Braga / Vila Verde)
- [ ] Specific press contact names/emails (Vila Verde journal, Neiva radio)

---

## 🤖 Deferred agentic capabilities

*Architecture extension points — not yet implemented. Turn on when the team is ready and there's bandwidth.*

- [ ] **Automated sponsor research + cold outreach** — AI researches candidate local businesses (boutiques, bars, gyms, record stores in Braga/Vila Verde), drafts per-business pitch emails referencing their specific audience fit, queues each via `/api/outbox` for 2-of-N vote, sends via Resend once approved. Needs: domain email (`beatnonstop.live`) verified in Resend, list of target businesses to seed research.
- [ ] **Press outreach automation** — same pattern: AI researches journalists covering Minho electronic scene, drafts pitches tailored to each outlet, queues for vote. Blocked on: poster release (already in timeline) + press contact list research.
- [ ] **Live Shotgun sales polling** — Cloudflare Worker cron polls Shotgun API every hour, updates `data/state.json` ticket counts + revenue, triggers monitoring thresholds automatically. Blocked on: Shotgun API credentials + rate limit check.
- [ ] **Daily morning briefing to the group** — Worker cron at 09:00 posts a 3-line summary: countdown, top 3 tasks due today, any flags. No LLM needed (pure template from state.json). Low effort, high value once team gets used to the bot.
- [ ] **Weather watch** (from May 10) — Worker cron pulls forecast for May 16, flags if >60% rain probability.
- [ ] **Outbound email sending** — wire Resend into the Worker's `executeOutboxItem` `case "email"` branch. Currently drafts are written to `generated/comms/` for humans to copy-paste.
