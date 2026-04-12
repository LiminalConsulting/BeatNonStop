# GoDaddy → GitHub Pages · beatnonstop.live

Step-by-step. Takes ~15 min of clicking + up to a few hours of DNS propagation.

---

## 1 · In the GitHub repo — enable Pages (do this first)

1. Open https://github.com/LiminalConsulting/BeatNonStop/settings/pages
2. Under **Source**, pick:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**
4. Wait 1 min. Temporary URL becomes live: `https://liminalconsulting.github.io/BeatNonStop/`
5. Open that URL in a browser. Confirm the site loads. ✅

---

## 2 · In GitHub — add your custom domain

1. Same settings page, scroll to **Custom domain**
2. Type: `beatnonstop.live`
3. Click **Save**
4. GitHub will run a DNS check — it **will fail** right now because we haven't added DNS records yet. That's fine, we fix it in step 3.
5. Leave **Enforce HTTPS** unchecked for now. We'll tick it later once DNS propagates.

Creating the custom domain here automatically adds a file called `CNAME` to the repo. **Do not delete that file.**

---

## 3 · In GoDaddy — add DNS records

1. Log into GoDaddy
2. Go to **My Products → Domains**
3. Click **DNS** (or the three-dot menu → Manage DNS) next to `beatnonstop.live`
4. You'll see the DNS records table. **Delete any existing A records or parking records** that GoDaddy added by default (usually pointing to 76.76.21.21 or similar "parked" IPs)
5. Add these **9 new records** (Add → select Type → fill in Name + Value):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `185.199.108.153` | 1 hour |
| A | @ | `185.199.109.153` | 1 hour |
| A | @ | `185.199.110.153` | 1 hour |
| A | @ | `185.199.111.153` | 1 hour |
| AAAA | @ | `2606:50c0:8000::153` | 1 hour |
| AAAA | @ | `2606:50c0:8001::153` | 1 hour |
| AAAA | @ | `2606:50c0:8002::153` | 1 hour |
| AAAA | @ | `2606:50c0:8003::153` | 1 hour |
| CNAME | www | `liminalconsulting.github.io` | 1 hour |

**GoDaddy quirks**:
- The **Name** field for apex records: GoDaddy writes this as `@`. Just leave the symbol `@` in that field.
- **Value field for CNAME**: GoDaddy requires a trailing dot for some records — if GoDaddy complains, try `liminalconsulting.github.io.` (with the dot). Otherwise drop it.
- If GoDaddy blocks you from adding multiple A records with the same Name — that's fine on modern GoDaddy but some legacy interfaces don't allow it. If stuck, the 4 A records are the most important (IPv4). The AAAA are IPv6 nice-to-haves.
- **Don't add** GoDaddy's default "Forwarding" rule — it conflicts with GitHub Pages.

6. Save all records.

---

## 4 · Wait for propagation

DNS typically propagates in 10 min – 2 hours. Sometimes up to 24h.

Check from terminal:
```
dig beatnonstop.live +short
```
When you see the `185.199.x.x` addresses returned, DNS is live.

Or use https://dnschecker.org and query `beatnonstop.live` A records — you want the 185.199.x.x range.

---

## 5 · Back in GitHub — enable HTTPS

1. Return to https://github.com/LiminalConsulting/BeatNonStop/settings/pages
2. The DNS check now passes (green check)
3. Tick **Enforce HTTPS**
4. GitHub issues a Let's Encrypt cert automatically (takes 5 min – 1 hour)

---

## 6 · Verify

Open each URL:
- [ ] `https://beatnonstop.live` → public event site
- [ ] `https://www.beatnonstop.live` → redirects to apex
- [ ] `https://beatnonstop.live/plan.html` → planning dashboard
- [ ] Lock icon visible (HTTPS)
- [ ] Countdown ticking
- [ ] Language switcher EN/PT/FR works

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 404 on beatnonstop.live | CNAME file deleted from repo, or Pages not enabled | Re-add custom domain in settings; confirm Pages source = main/root |
| GoDaddy's "Parking Page" still shows | Cached or GoDaddy forwarding rule not deleted | Delete all A records pointing to GoDaddy parking IPs; also delete any "Domain forwarding" rule |
| DNS check fails in GitHub Pages settings | Records not propagated yet | Wait 30 min, retry |
| Mixed content warning (padlock broken) | Any asset loading via `http://` | All current assets use relative paths — shouldn't occur |
| HTTPS cert unavailable after 24h | DNS misconfigured somewhere | Re-verify DNS records, unset/re-set custom domain to retrigger |
| `plan.html` indexed by Google | Privacy concern | It has `noindex` meta tag. For stronger privacy make repo private or move plan.html behind a password. |

---

## Once this is done: Shotgun integration

After `beatnonstop.live` is live, proceed to `setup/shotgun-integration.md` to wire the ticket widget into `index.html`.
