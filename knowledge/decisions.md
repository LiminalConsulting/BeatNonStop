# Decision Log

*Decisions are final once logged. Reopening requires a new entry.*

---

## ✅ Decisions made

### 2026-04-12 · Legal umbrella via Duas Igrejas parish
**Decision**: Operate under Duas Igrejas parish NIF. They manage the bar, permit, and insurance umbrella.
**Rationale**: Established community relationship, simplifies compliance, bar is theirs to run (and they keep the profits).
**Implication**: Parish is a true partner. Event branding is Beat Nonstop but legally tied to the parish community.

### 2026-04-12 · Ticket platform = Shotgun.live
**Decision**: Use Shotgun.live for ticket sales via embedded widget on beatnonstop.live.
**Rationale**: European focus, MB WAY support (~45% of PT payments), fair fees, widget keeps checkout on our domain.
**Implication**: Shotgun organizer account under Duas Igrejas parish NIPC + parish IBAN (see 2026-04-14 entry below, which supersedes the earlier personal-NIF plan).

### 2026-04-14 · Shotgun legal entity = Duas Igrejas parish NIPC (supersedes personal-NIF plan)
**Decision**: The Shotgun organizer account and connected Stripe payout run under the Duas Igrejas parish NIPC with a parish-controlled IBAN. All ticket revenue flows to the parish account; Beat Nonstop reconciles with the parish post-event.
**Rationale**: Shotgun rejected the initial submission because a personal NIF cannot legally front commercial ticket sales at this scale without the seller being registered as sole trader (*recibos verdes*) — which would reshape David Pereira's tax/social-security position for a one-off event. The parish is already the legal umbrella for the bar, permit, and alcohol license (2026-04-12 decision), so extending that umbrella to ticketing is the coherent move.
**Implication**: Parish is the merchant of record on Shotgun. Event branding stays Beat Nonstop, operations stay with the team, but legal/financial flow runs through the parish. Tonight's meeting (2026-04-14) is the decision point — parish NIPC + IBAN must be gathered and Shotgun organizer fields updated before ticket launch can proceed.

### 2026-04-12 · Event concept
**Decision**: "Lua Nova" — celebrate the actual new moon of May 16. Cosmic / celestial aesthetic.
**Rationale**: Genuine coincidence with the astronomical new moon. Theme hasn't been done locally.
**Implication**: Decor + marketing lean celestial. Spiritual/manifestation language kept for community context, not on the public site.

### 2026-04-12 · Age policy: 13+ with wristband tiering
**Decision**: Admission from age 13. White wristband for 13–17 (no alcohol, free soft drink). Adult wristband for 18+. Under-13 not admitted, no exceptions.
**Rationale**: Families with teens are normal in Vila Verde culture. 18+ would cut real attendees. Wristband system protects the parish alcohol license.
**Implication**: Door team ID-checks anyone who looks under 25. Bar staff briefed before doors: "no wristband or white wristband = no alcohol, no exceptions." Parent consent form for 13–17.

### 2026-04-12 · Artist payment structure
**Decision**: Cash, no contracts. 3 artists paid (Sun Profile €300, Kika Lewis €400, John €750). 4 artists unpaid (break even via food/logistics/exposure). 50% upfront. €100 success bonus to 6 non-Tiago artists if the event succeeds.
**Rationale**: Friend-based network. Contracts would add bureaucracy incompatible with this culture.
**Implication**: Daily contact with artists is the substitute for legal enforceability. Trust is the mechanism.

### 2026-04-13 · Flat pricing (no Early Bird)
**Decision**: Single price €15 from launch through door. Duo Pack €20 (2 tickets, €10 each). VIP and T-shirt pack deferred until stage layout + merch design are ready.
**Rationale**: Simplifies marketing. Scarcity driver is the event itself (new moon, one night), not ticket tiers.
**Implication**: Break-even trajectory tracked vs 475 (floor) / 577 (full) / 1000 (target).

### 2026-04-13 · Domain = beatnonstop.live
**Decision**: Purchased `beatnonstop.live` from GoDaddy. Connected to GitHub Pages.
**Rationale**: Available, on-brand, thematic.
**Implication**: All marketing links point to beatnonstop.live. Public site + planning dashboard live on same domain.

### 2026-04-13 · Coordination system = Telegram bot + /sync + repo
**Decision**: Deploy the bot architecture described in ARCHITECTURE.md. Telegram is the team's interface; the dashboard is read-only; /sync runs once a day.
**Rationale**: Non-technical team, need agentic behavior, cost-controlled via Claude Max subscription.
**Implication**: Every outbound action from the bot requires 2 👍 votes from non-builder members. Organizers plan in the Telegram group so the bot sees everything.

---

## 🤔 Pending decisions

### Door staff identity
**Options**: Trusted friend (volunteer or paid), ideally female for tone. Fallback: split shifts.
**Owner**: Team
**Deadline**: May 3

### First aid arrangement
**Options**: Trained volunteer vs. contracted paramedic (~€150).
**Owner**: Team
**Deadline**: May 3

### VIP table configuration
**Options**: Depends on stage vendor's platform dimensions — how many platforms, size, capacity per platform.
**Owner**: Tiago (awaiting stage vendor confirmation)
**Deadline**: End of April

### T-shirt pack
**Options**: Launch with merch design ready vs. skip for this edition.
**Owner**: Team + marketing
**Deadline**: April 27
