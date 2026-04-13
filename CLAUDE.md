# CLAUDE.md — New Moon Techno Event Website
## Identity Anchor · Read this every session before writing a single line of code.

> **⚠️ New session? Read these first:**
> - `ARCHITECTURE.md` — coordination system map (Telegram bot + /sync + dashboard + auto-sync daemon)
> - `SETUP.md` — bot deployment checklist
> - `EVENT_SYSTEM_PROMPT.md` — operating modes
> - `knowledge/` — canonical event facts · `data/` — live state
>
> This file below is the **public website redesign** spec only. The coordination system is a separate concern that shares this repo.
>
> **Heads-up: `/sync` runs automatically.** A `launchd` agent on David's Mac polls `origin/main` every 120s and runs `claude -p "/sync"` headlessly when the Worker pushes new commits. So if you push to `main` from a Claude session, expect the daemon to wake up shortly after. To pause it during a manual editing session, run `launchctl unload ~/Library/LaunchAgents/live.beatnonstop.sync.plist`. See `ARCHITECTURE.md` → "Auto-sync daemon" for full management commands. The daemon script lives at `scripts/sync-daemon.sh`; the plist is machine-local (template at `scripts/sync-daemon.plist.example`).

---

## 🎯 Project Overview

This is a **public-facing event website** for a new moon techno event. It lives in a GitHub repository and deploys via **GitHub Pages** as a static site (pure HTML + CSS + JS — no build step, no Node, no frameworks required unless you set one up explicitly).

There is also a **private planning page** (`/planning` or `planning.html`) that shares the color system and typography but does NOT need animations or abstract visuals — it's functional, readable, and consistent with the brand.

**Goal**: Transform the current generic AI-generated website into something that looks like it was designed by a professional studio for a real European techno event — on par with KNTXT (Charlotte de Witte), Awakenings Festival, or Fabric London. No one looking at this should be able to tell AI built it.

---

## 🚫 What You Must NEVER Do

- Use Inter, Roboto, Arial, Poppins, or system fonts as the primary display font
- Use purple-to-blue gradients, teal accents, or any "default AI palette"
- Use excessive rounded corners (`border-radius > 4px` on structural elements)
- Use shadcn default grays or Tailwind's default color palette without overrides
- Use Lucide or HeroIcons as the default icon set
- Add animations for their own sake — every motion must have intent
- Use placeholder lorem ipsum text — work with whatever content is in the current files
- Ask the user for input before executing — **run as far as possible autonomously**
- Make assumptions that require a paid API key — build the full site first; video is enhancement only

---

## 🏗️ Execution Order

Follow this order strictly. Each phase should be completable without user input.

### PHASE 1 — Audit & Inventory (do this first, no changes yet)
1. Read ALL existing files in the repository. Understand the current structure.
2. Note: what pages exist, what content is on them, what links/nav exist
3. Note: what the current color palette is (extract hex values if possible)
4. Note: what the logo file is named and where it lives
5. Identify if there's a `planning.html` or equivalent private planning page
6. Output a brief audit summary as a comment or in a `AUDIT.md` scratchpad file

### PHASE 2 — Design System Setup
Create a `styles/design-system.css` file that defines ALL CSS custom properties:

```css
:root {
  /* Core palette — derived from new moon aesthetic */
  --color-void: #050508;          /* deepest background — almost black with faint blue-black */
  --color-surface: #0d0d14;       /* card/section backgrounds */
  --color-border: #1a1a2e;        /* subtle borders */
  --color-moon: #c8c8d4;          /* primary text — cool silver-white, not pure white */
  --color-moon-dim: #6b6b80;      /* secondary/muted text */
  --color-accent: #9fa8c7;        /* accent — dusty blue-grey, lunar light */
  --color-accent-bright: #d4d8f0; /* hover states, active elements */

  /* Typography scale */
  --font-display: 'Monument Extended', 'Archivo Black', sans-serif;
  --font-body: 'DM Mono', 'Space Mono', monospace;
  --font-ui: 'Neue Haas Grotesk', 'Helvetica Neue', 'Arial', sans-serif;

  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 4rem;
  --space-xl: 8rem;
  --space-2xl: 16rem;

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.87, 0, 0.13, 1);
  --duration-fast: 200ms;
  --duration-med: 500ms;
  --duration-slow: 1200ms;
}
```

**Typography rationale**: Monument Extended (or Archivo Black as free fallback) is used by major techno brands. It's condensed, authoritative, uppercase-friendly. DM Mono for body text gives an underground, anti-corporate feel — like a zine.

**Font loading** — use Google Fonts for free fonts. For Monument Extended (not free), fall back to Archivo Black which IS free and reads similarly:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

### PHASE 3 — Core Layout Rebuild

Rebuild `index.html` (and any other public pages) with this structure. Keep all existing content — do not delete event info, lineup, dates, links. Only upgrade presentation.

#### Section 1: Hero (full viewport)
```
[full-height viewport]
├── Background: CSS starfield / particle canvas (JS, no library needed — see below)
├── Logo: centered, top-third, filtered to --color-moon tones
├── Event name: massive uppercase, Monument Extended / Archivo Black, letter-spacing: 0.15em
├── Date + Location: --font-body, small, --color-moon-dim, below event name
├── [subtle lunar phase SVG animation — crescent to new moon, CSS only]
└── Scroll indicator: thin vertical line with animated dot descending
```

**Starfield implementation** (pure JS, no CDN needed):
```javascript
// Paste this directly into a <script> tag or stars.js
(function() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function init() {
    stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        opacity: Math.random() * 0.6 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 3000;
    stars.forEach(s => {
      const o = s.opacity + Math.sin(t + s.pulse) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 212, ${Math.max(0, o)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  
  window.addEventListener('resize', () => { resize(); init(); });
  resize();
  init();
  draw();
})();
```

**Lunar phase SVG** — a simple crescent that breathes:
```css
.moon-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  box-shadow: inset -12px 0 0 0 var(--color-accent);
  animation: moonbreath 8s ease-in-out infinite;
  opacity: 0.7;
}
@keyframes moonbreath {
  0%, 100% { box-shadow: inset -12px 0 0 0 var(--color-accent); opacity: 0.7; }
  50% { box-shadow: inset -10px 2px 0 0 var(--color-accent-bright); opacity: 0.9; }
}
```

#### Section 2: About / Concept (dark, text-forward)
```
[--color-surface background]
├── Small caps label: "THE EVENT" — --color-accent, tracked out, tiny
├── 2-3 lines of atmospheric copy about the new moon concept
├── Horizontal rule: 1px, --color-border
└── [Scroll-reveal: text fades + slides up on intersection]
```

**Scroll reveal** (pure JS, no GSAP needed for simple reveals):
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```
```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity var(--duration-slow) var(--ease-out-expo),
              transform var(--duration-slow) var(--ease-out-expo);
}
.reveal.visible { opacity: 1; transform: translateY(0); }
```

Add class `reveal` to every section block that should animate in.

#### Section 3: Lineup
```
[--color-void background]
├── Label: "LINEUP"
├── Artist names: large uppercase, stacked list, dividers between them
│   Each row: [name] .............. [time if known, else "—"]
├── On hover: row background lifts slightly, name gets --color-accent-bright
└── Mobile: same layout, smaller type
```

Tabular layout using CSS grid, not a table element:
```css
.lineup-row {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--duration-fast) ease;
}
.lineup-row:hover { background: rgba(159, 168, 199, 0.04); }
```

#### Section 4: Date / Venue / Info
```
[--color-surface background]
├── Three columns (mobile: stack): Date | Location | Doors
├── Each column: label in --color-accent small caps, value in large --font-display
└── Optional: embedded static map (OpenStreetMap iframe, no API key needed)
```

OpenStreetMap embed (free, no API key):
```html
<iframe 
  src="https://www.openstreetmap.org/export/embed.html?bbox=LON,LAT,LON,LAT&layer=mapnik"
  style="border:0; filter: invert(1) hue-rotate(180deg) brightness(0.85);"
  loading="lazy">
</iframe>
```
Replace bbox coordinates with actual venue coordinates. The CSS filter makes it dark-mode-consistent.

#### Section 5: Tickets CTA
```
[--color-void background, full width]
├── Large text: "GET YOUR TICKET"
├── Single button: outlined style, --color-moon border + text
│   On hover: fills with --color-moon, text becomes --color-void (inverted)
└── Below button: any booking platform note (RA, Dice, etc.)
```

Button style — no gradients, no shadows, sharp edges:
```css
.btn-primary {
  display: inline-block;
  padding: 1.25rem 3rem;
  border: 1.5px solid var(--color-moon);
  color: var(--color-moon);
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background var(--duration-fast) ease, color var(--duration-fast) ease;
  cursor: pointer;
}
.btn-primary:hover {
  background: var(--color-moon);
  color: var(--color-void);
}
```

#### Section 6: Footer
```
Minimal: logo left | social links center | "© [year] [name]" right
No decorative elements. 1px top border --color-border.
```

### PHASE 4 — Navigation

Sticky nav that starts transparent over hero, transitions to solid on scroll:
```css
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 1.5rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  transition: background var(--duration-med) ease, backdrop-filter var(--duration-med) ease;
}
nav.scrolled {
  background: rgba(5, 5, 8, 0.85);
  backdrop-filter: blur(12px);
}
```
```javascript
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 80);
});
```

Nav links: uppercase, tracked, small, --color-moon-dim. Hover → --color-moon.

Mobile: hamburger toggle. Simple CSS transition, no library.

### PHASE 5 — Mobile Optimization

Every section must be tested at 375px, 430px, 768px, 1280px, 1920px breakpoints.

Key mobile rules:
- Hero text scales: `font-size: clamp(2.5rem, 10vw, 8rem)` for event name
- Lineup rows stay readable — bump font slightly on mobile
- Nav collapses to hamburger at 768px
- Canvas hero still runs on mobile but with reduced star count (100 instead of 200)
- All touch targets minimum 44px height
- No horizontal scroll at any viewport

### PHASE 6 — Planning Page (`planning.html`)

This page is simpler — no starfield, no hero animation. It shares:
- Same `design-system.css`
- Same fonts
- Same color palette
- Same nav

Content: Whatever is currently on the planning page (dates, tasks, contacts, notes).

Presentation: Clean, minimal, document-like. Think dark-themed Notion without the branding.
- Use a max-width container (800px centered)
- Headings in --font-display, body in --font-body
- Tables for any structured data (attendees, schedule, budget)
- Code-like borders and section separators

### PHASE 7 — Performance & Deploy Check

Before finishing:
1. Run a manual check: all `<img>` tags have `loading="lazy"` and explicit `width`/`height`
2. All fonts have `font-display: swap`
3. No external scripts that aren't from trusted CDNs (Google Fonts, cdnjs only)
4. The `<head>` has proper meta tags: viewport, description, og:image, og:title
5. Verify `index.html` works when opened directly as a file (no server required for GitHub Pages)
6. Add/update `.gitignore` to exclude any temp files
7. Output the exact git commands to push:
   ```
   git add .
   git commit -m "feat: full redesign — new moon techno aesthetic"
   git push origin main
   ```

---

## 🎬 PHASE 8 — Video Hero (MANUAL STEP — requires you)

**This phase cannot be automated. The agent will stop here and give you clear instructions.**

The site is fully functional without a video. This phase upgrades the hero from the animated starfield canvas to a looping AI-generated video background — adding significant visual impact.

### Option A: Pika Labs (Recommended — Genuinely Free)
**Free tier**: 250 credits on signup + 30 credits/day. No credit card required. No watermark on free tier downloads.

1. Go to [pika.art](https://pika.art) and create a free account
2. Use this exact prompt for generation:
   ```
   Abstract dark space. Slow drifting particles of cool silver-white light against 
   deep black void. New moon atmosphere. Subtle cosmic dust. No faces, no text, 
   no objects. Purely ambient. Seamless loop. Cinematic. 4:3 or 16:9. 5-8 seconds.
   ```
3. Generate 2-3 variations and pick the best
4. Download as MP4 (free downloads available)
5. Place the file in `/assets/video/hero-loop.mp4`
6. Then run this in Claude Code:
   ```
   Update the hero section to use the video file at /assets/video/hero-loop.mp4 
   as a muted looping autoplay background. Keep the starfield canvas as a 
   JavaScript fallback if the video fails to load. Ensure mobile gets the canvas 
   fallback since autoplay video is restricted on iOS.
   ```

### Option B: Kling AI (Free daily credits)
**Free tier**: 66 credits/day, no credit card for basic tier.

1. Go to [klingai.com](https://klingai.com)
2. Use same prompt as above
3. Download and follow same steps

### Option C: Haiper AI (Genuinely free tier, no limits on basics)
1. Go to [haiper.ai](https://haiper.ai)
2. Create account (Google login works)
3. Use the same prompt — Haiper is more abstract/artistic which works well here

### Implementation note once you have the video:
```html
<video id="hero-video" autoplay muted loop playsinline 
       poster="assets/img/hero-poster.jpg"
       style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.4;">
  <source src="assets/video/hero-loop.mp4" type="video/mp4">
</video>
```
Opacity 0.4 keeps it subtle — the text must remain readable.

---

## 🎨 Design References (DO NOT ASK FOR THESE — USE AS INTERNAL REFERENCE)

The agent should internalize these as style guides:

### KNTXT (kntxt.be)
- Pure black, near-zero color
- Massive uppercase type with extreme tracking (letter-spacing: 0.2-0.4em)
- Zero decorative elements — white space IS the design
- This is the typographic discipline reference

### Awakenings (awakenings.com)
- Cinematic hero, dark photography or video
- Logo treated as architectural element
- Very clear hierarchy: one image + title + single CTA
- This is the event structure reference

### Fabric London (fabriclondon.com)
- Art-directed event pages
- Text-forward, underground tone
- Each event feels distinct within a consistent brand system
- This is the "soul" reference — serious, underground, not trying to impress

### What makes these NOT AI slop:
- Typography is the primary design element, not decoration
- Negative space is used intentionally and generously
- Color palette is limited (2-3 colors max) with precise application
- Animations are subtle and serve navigation, not spectacle
- Everything communicates "we don't need to try hard" — confidence through restraint

---

## 📁 File Structure Target

```
/
├── index.html              ← Public event page (main output)
├── planning.html           ← Private planning page (consistent palette)
├── styles/
│   ├── design-system.css   ← All CSS variables, typography, base resets
│   ├── main.css            ← Component styles, layout
│   └── planning.css        ← Planning page overrides (minimal)
├── js/
│   ├── stars.js            ← Starfield canvas animation
│   ├── scroll.js           ← Scroll reveal + nav behavior
│   └── nav.js              ← Mobile hamburger menu
├── assets/
│   ├── img/
│   │   ├── logo.svg        ← Event logo (or whatever format exists)
│   │   └── hero-poster.jpg ← Static fallback for video (generate from Unsplash dark space image)
│   └── video/
│       └── hero-loop.mp4   ← (MANUAL STEP — see Phase 8)
├── CLAUDE.md               ← This file
└── AUDIT.md                ← Scratchpad (can be gitignored)
```

---

## 🧠 Tone & Copy Guidance

If the current site has generic or thin copy, upgrade it with this voice:

**The vibe**: minimal, serious, atmospheric. Like a Berlin club's Instagram bio — not trying to explain itself, just stating facts with intention.

**Good examples**:
- ✅ "New moon. No light. Full sound."
- ✅ "A gathering for the night."
- ✅ "Doors open at sundown."
- ❌ "Welcome to our amazing techno event! We are excited to invite you to..."
- ❌ "Experience the magic of electronic music under the stars!"

If no copy is provided for a section, write in this voice. Keep it short. Under 20 words per text block.

---

## ⚡ Quick Fixes That Instantly Elevate (Do All of These)

Even if the full redesign isn't done, these transforms are non-negotiable:

1. **Background**: `#050508` not `#000000` — pure black feels cheap, near-black feels considered
2. **Text**: Never pure `#ffffff` — use `#c8c8d4` (cool silver-white)
3. **Fonts loaded**: Archivo Black + DM Mono must be loading via Google Fonts
4. **Letter spacing**: Any headline → `letter-spacing: 0.12em` minimum
5. **Line height**: Body text → `line-height: 1.7`
6. **Section padding**: Generous — `padding: 6rem 0` at minimum, `10rem 0` for hero sections
7. **Border**: Replace any box-shadows with `border: 1px solid var(--color-border)`
8. **Cursor**: `cursor: default` everywhere — remove pointer cursor on non-interactive elements

---

## 🛑 Session Checkpoints

At the end of each Claude Code session, output:
1. What was completed
2. What files were changed
3. What still remains (and in which phase)
4. Whether any manual steps are pending (Phase 8)
5. The current state of the site in one sentence

---

## ✅ Definition of Done

The public site is done when:
- [ ] Opens on mobile (375px) and looks intentional, not broken
- [ ] Opens on desktop (1440px) and looks like a real European techno event site
- [ ] Hero section has either the starfield canvas or a video background (Phase 8)
- [ ] No default AI palette elements remain (check for Inter font, purple/blue gradients, excessive border-radius)
- [ ] Copy is in the correct voice — short, atmospheric, confident
- [ ] Navigation works on mobile (hamburger) and desktop
- [ ] Scroll reveals are active on at least 3 sections
- [ ] GitHub push commands are ready to copy-paste

The planning page is done when:
- [ ] Uses the same color palette and fonts
- [ ] All existing planning content is preserved and readable
- [ ] Dark background, clean typography, table-based layout where appropriate
