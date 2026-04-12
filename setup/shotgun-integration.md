# Shotgun Integration · Own the Ticket Experience

Goal: People click **"Comprar Bilhetes"** on `beatnonstop.live` → checkout opens **on our page** (not a redirect to shotgun.live). They still benefit from Shotgun's discovery (events listing inside the Shotgun app) because the event also lives on shotgun.live — but our domain is the primary face.

Shotgun supports this natively via their **Widget**. Two modes:

| Mode | How it looks | When to use |
|------|-------------|-------------|
| **Event Widget (iframe)** | Full event page + checkout embedded inside your site | Best — people never leave beatnonstop.live |
| **Button Widget** | A styled "Buy Tickets" button → opens modal with checkout | Cleaner visual, opens as overlay |
| **Direct link** | Simple `<a href="shotgun.live/event/...">` | Fallback — loses control |

Recommendation: **Event Widget (iframe mode)**.

---

## Step-by-step after Shotgun event is created

### Step 1 · Create the event on Shotgun

1. Log into https://pro.shotgun.live with David's account
2. Complete Stripe KYC first (ID + IBAN) — nothing can go live before this
3. Click **Create Event**
4. Fill the form using content from `generated/shotgun/event-description.md`
5. Create the two ticket tiers:
   - **Geral** — single ticket — €15
   - **Pack Duo** — use "Group Ticket" feature — 2 attendees — €20 total
     - Help: https://support-pro.shotgun.live/hc/en-us/articles/31915366271634-Create-group-tickets
6. Set age restriction to 13+
7. Publish (or save as draft to test the widget first)

### Step 2 · Grab the widget embed code

1. In your event dashboard: **Marketing → Widget → Event**
2. Select the Lua Nova event from dropdown
3. Copy the HTML snippet — it looks roughly like this:

```html
<div id="shotgun-widget"></div>
<script src="https://widgets.shotgun.live/widget.js"
        data-event-id="YOUR_EVENT_ID"
        data-theme="dark"
        data-lang="pt"></script>
```

*(Exact attribute names may differ — trust what Shotgun gives you over this template.)*

### Step 3 · Paste it into our site

Replace the placeholder block we staged in `index.html`:

```html
<!-- Currently in index.html, around the tickets section -->
<div id="shotgun-widget" class="reveal" ...>
  <a href="#" id="shotgun-link" class="btn-primary">Comprar Bilhetes</a>
  ...
</div>
```

With the Shotgun embed code. Paste right where `<div id="shotgun-widget">` currently sits.

**Tips**:
- Set `data-theme="dark"` to match our palette
- Set `data-lang="pt"` so the checkout UI defaults to Portuguese
- Wrap the widget in our existing `.reveal` class so it fades in on scroll
- Keep the static ticket cards above (Geral / Duo Pack) as visual reference — the widget handles the actual purchase

### Step 4 · Test the full flow

1. Push updated `index.html` to GitHub
2. Wait 1 minute for Pages to rebuild
3. Open https://beatnonstop.live
4. Scroll to tickets section
5. Click a ticket tier inside the widget
6. **Do one real test purchase with a real card** (€15 is cheap; refund later or keep as first sale)
7. Verify:
   - [ ] Checkout happens inline (page doesn't redirect away)
   - [ ] MB WAY option appears (Portuguese payment method)
   - [ ] Confirmation email arrives
   - [ ] QR code is generated
   - [ ] Ticket shows up in Shotgun dashboard

---

## Configuration checklist for Shotgun event

| Setting | Value |
|---------|-------|
| Event name | Beat Nonstop: Lua Nova |
| Date | 16 May 2026, 18:00–04:00 |
| Venue | Ribeira da Neiva, Duas Igrejas, Vila Verde |
| Cover image | BNS logo (until poster is ready) |
| Description | Paste from `generated/shotgun/event-description.md` (Portuguese) |
| Age restriction | 13+ |
| Tiers | Geral €15 · Pack Duo €20 (group of 2) |
| Refund policy | Default (no refunds except cancellation) |
| Timezone | Europe/Lisbon |
| Currency | EUR |

---

## If the widget doesn't work well (fallback plan)

If iframe embed causes issues (ad blockers, mobile quirks), fall back to **direct link**:

1. Grab the public Shotgun event URL (e.g. `https://shotgun.live/en/events/beat-nonstop-lua-nova`)
2. Replace `href="#"` in `index.html` with that URL
3. Add `target="_blank" rel="noopener"` so it opens in a new tab

This keeps beatnonstop.live as the primary face and Shotgun as a clean second tab for checkout only.

---

## Later — when poster + lineup ready

- Replace cover image in Shotgun with the finished poster
- Add lineup in the event description under the existing text
- Promote the event on Shotgun's discovery feed (happens automatically but ensure event is **Published**, not **Draft**)

---

## Support contacts

- Shotgun help: help.shotgun.live
- Email: `organizers@shotgun.live`
- Expected reply time: 1 business day
