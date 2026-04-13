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
**Implication**: David holds the Stripe account under his personal NIF + IBAN. After the event, he settles any shared expenses with the parish via standard bank transfer.

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
