# Domain + GitHub Pages Setup Guide

Goal: Point a custom domain (e.g. `beatnonstop.pt`) at the `index.html` / `plan.html` in this repo, so the public site loads at `https://beatnonstop.pt` and the planning dashboard at `https://beatnonstop.pt/plan.html`.

---

## Step 1 · Choose and buy a domain

### Recommended extensions (pick one)
| TLD | Price | Notes |
|-----|-------|-------|
| `.pt` | ~€15–30/yr | Most credible for PT audience. Requires a PT/EU address. Use .PT registrar or Namecheap. |
| `.earth` | ~€35/yr | Conceptual + available. Works anywhere. |
| `.live` | ~€25/yr | Thematic (live music). Short. |
| `.events` | ~€25/yr | Explicit. |

**Our pick**: `beatnonstop.pt` if David has a PT address, else `beatnonstop.earth`.

### Where to buy
- **Namecheap** (easy, English): namecheap.com
- **PTisp** or **.PT direct** (Portuguese registrar for .pt specifically): dominios.pt
- **Porkbun** (good prices): porkbun.com

---

## Step 2 · Enable GitHub Pages on the repo

1. Push all current changes (we'll do this at the end of the commit).
2. Go to https://github.com/LiminalConsulting/BeatNonStop/settings/pages
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**.
5. Wait ~1 minute. GitHub will publish the site at `https://liminalconsulting.github.io/BeatNonStop/`.
6. Open that URL in a browser — if `index.html` loads, Pages is working. ✅

---

## Step 3 · Point the domain at GitHub Pages

### A. Tell GitHub about the domain
1. Still on the Pages settings page, fill **Custom domain** with your chosen domain (e.g. `beatnonstop.pt`) and click **Save**.
2. GitHub creates a `CNAME` file automatically in the repo — **don't delete it**.
3. Tick **Enforce HTTPS** once the cert is issued (usually within an hour).

### B. Configure DNS at your registrar

Log into your domain registrar's DNS settings and add these records:

**For an apex domain** (e.g. `beatnonstop.pt`, not `www.beatnonstop.pt`):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |
| AAAA | @ | 2606:50c0:8000::153 | 3600 |
| AAAA | @ | 2606:50c0:8001::153 | 3600 |
| AAAA | @ | 2606:50c0:8002::153 | 3600 |
| AAAA | @ | 2606:50c0:8003::153 | 3600 |
| CNAME | www | liminalconsulting.github.io | 3600 |

*(The A + AAAA records point the apex to GitHub Pages. The CNAME handles the `www.` subdomain.)*

**DNS propagation**: can take anywhere from 10 minutes to a few hours. Check with:
```
dig beatnonstop.pt +short
```
Expect to see the 185.199.108.x range.

### C. Confirm in GitHub
After DNS propagates, the Pages settings page will show a green checkmark for the custom domain. HTTPS cert gets issued automatically within a few hours.

---

## Step 4 · Verify everything works

Open each URL and confirm:
- [ ] `https://beatnonstop.pt` loads the public event site
- [ ] `https://beatnonstop.pt/plan.html` loads the planning dashboard
- [ ] `https://www.beatnonstop.pt` redirects to the apex
- [ ] Lock icon visible (HTTPS enforced)
- [ ] Language switcher works on both pages
- [ ] Countdown is ticking

---

## Step 5 · Use the domain for email (optional, via Proton)

Once domain is live:
1. Sign up for **Proton Mail** (free tier → paid €4/mo for custom domains)
2. Add `beatnonstop.pt` as a domain in Proton's settings
3. Proton gives you MX + TXT + DKIM records to add at your registrar
4. Create mailboxes like `hello@beatnonstop.pt` and `press@beatnonstop.pt`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 404 on custom domain | CNAME file missing or deleted | Re-add Custom domain in Pages settings |
| DNS not resolving | Propagation still pending | Wait 1 hour, check `dig` |
| HTTPS unavailable | Cert not issued yet | Wait — can take up to 24h on day one |
| Mixed content warning | Some asset loads via http:// | All assets use relative paths already, should be fine |
| `plan.html` publicly found by Google | Has `noindex` meta tag set | Already protected. Don't share the URL widely. |

---

## Important notes

- The CNAME file in the repo (created by GitHub when you set the custom domain) must **not** be deleted.
- If you ever rename the repo or change GitHub org, Pages URL changes — update CNAME target.
- Planning page has `<meta name="robots" content="noindex, nofollow" />` but is still technically public. For true privacy, make the repo private or move planning behind a password. Current trade-off is fine for your use case.
