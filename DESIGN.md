# DESIGN.md — Personal Site (Starfield / stormzhang-inspired)

> Atmosphere reference: [stormzhang.ai](https://stormzhang.ai/) starfield + deep-space personal landing.  
> IA follows `docs/PAGE-CONTRACTS.md`: hero (name + bio + focus) → doing → projects → writing → connect.  
> Long contact details live in Earth easter egg only.

Agents **must** read this file before changing any visual output. Colors live in `src/styles/tokens.css`.

**Active theme:** Starfield dark (deep navy + cyan accent). Style gallery under `design-previews/` is historical only.

---

## 1. Visual Theme & Atmosphere

- Deep space canvas `#050510`, not pure Linear black.
- Full-page **starfield** (canvas) + slow **nebula** gradients + light film grain.
- Content sits above the sky (`z-index ≥ 1`); sky is non-interactive (`pointer-events: none`).
- Glass panels: translucent surface + hairline + light blur so text stays readable over stars.
- Chromatic accent: cyan `#38f9d7` + soft sky blue `#60a5fa` (name gradient / CTAs / links).
- System UI stack (SF / 苹方 on Apple); quiet, personal, night-sky feel. No third-party webfonts.

## 2. Color Palette & Roles

| Token | Hex / value | Role |
|-------|-------------|------|
| `--color-canvas` | `#050510` | Page / deepest space |
| `--color-surface` | `rgba(12, 16, 32, 0.55)` | Glass cards |
| `--color-surface-solid` | `#0c1020` | Solid fallback / code |
| `--color-surface-2` | `rgba(18, 24, 48, 0.65)` | Hover / inset |
| `--color-surface-3` | `#121830` | Code blocks |
| `--color-hairline` | `rgba(148, 163, 184, 0.14)` | Borders |
| `--color-hairline-strong` | `rgba(148, 163, 184, 0.28)` | Strong border |
| `--color-ink` | `#e6edf3` | Primary text |
| `--color-body` | `#c9d1d9` | Body copy |
| `--color-mute` | `#8b949e` | Meta, captions |
| `--color-mute-deep` | `#6e7681` | Lowest emphasis |
| `--color-primary` | `#38f9d7` | Accent / CTA |
| `--color-primary-hover` | `#60a5fa` | Hover / secondary chroma |
| `--color-on-primary` | `#050510` | Text on solid accent button |
| `--color-link` | `#60a5fa` | Inline links |
| `--color-link-deep` | `#38f9d7` | Link emphasis |
| `--color-error` | `#f85149` | Errors only |

**Do not** reintroduce Linear lavender as primary, or light-mode marketing skins, without rewriting this file.

## 3. Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| display-xl | clamp 40–72px | 600 | Hero name |
| display-lg | 28–36px | 600 | Page titles |
| display-md | 18–22px | 600 | Section titles |
| body-lg | 18–20px | 400–500 | Tagline |
| body-md | 16–17px | 400 | Default UI |
| body-sm | 14px | 400 | Nav, cards |
| caption | 12–13px | 400 | Meta |

**Fonts** (system only — no Google Fonts / self-hosted webfonts)

- UI / body: `-apple-system`, `BlinkMacSystemFont`, then `Segoe UI` / `Helvetica Neue`, then Chinese: `"PingFang SC"`, `"Hiragino Sans GB"`, `"Microsoft YaHei"`, `"Noto Sans SC"`, `system-ui`
- Code: `"SF Mono"`, `ui-monospace`, `Menlo`, `Monaco`, `Consolas`, monospace

On Apple devices this resolves to **SF + 苹方**; Windows to Segoe UI + 微软雅黑. Prefer native system faces over Inter or other Latin webfonts.

**Rules**

- Hero name may use cyan→blue **static gradient text** (no shimmer animation).
- UI body line-height ~**1.47**; posts / long bio ≥ **1.65**.
- Large titles: slight **negative** tracking (~`-0.02em` … `-0.03em`); avoid wide positive tracking on body.
- Section titles use mute ink, not huge marketing banners.
- Decoration budget: solar opacity ~0.55–0.7 desktop / ≤0.4 mobile; Earth pulse only on hover; primary CTA solid accent, no glow.

## 4. Components

### Starfield

- `#starfield` fixed full-viewport canvas under content.
- Twinkling stars (white / cool blue / sparse cyan).
- Soft milky-band or nebula optional; must stay performant on mobile.
- Respect `prefers-reduced-motion: reduce` → static stars or CSS-only fallback.

### Solar system

- `#solar-system` fixed canvas above starfield (`z-index: 1`), non-interactive.
- Artistic 2D orbits (not real AU): Sun + 8 planets, asteroid belt, Earth moon, Saturn rings.
- Anchored to **right** of viewport with left fade mask so prose stays readable.
- Mobile: lower opacity + vertical fade; still decorative only.
- `prefers-reduced-motion: reduce` → freeze orbits (static frame).
- **Easter egg:** click Earth → `#earth-egg` dialog (intro + contact from `content/site.yaml` `easterEgg`). Soft cyan pulse on Earth; generous hit radius.

### Buttons

- **Primary**: solid or strong cyan fill, dark text, radius **999px** (soft pill) or 10px.
- **Secondary**: glass border cyan-tint, light text.
- Hover: shift toward sky blue; no heavy shadows.

### Cards

- Generic glass (if reused): translucent surface, 1px hairline, radius **14–16px**, padding 18–22px; optional `backdrop-filter: blur(12px)`.

### Project tarot cards (`#projects`) — style **C holographic foil**

Portrait “spread” cards (not flip) for `projects[]`. Visual language: thin animated foil rim + deep plate; starfield tokens only (no stock tarot art, no webfonts). Soft violet may appear **only** on the 2px foil gradient, never as UI fill/text primary.

#### Proportion (physical tarot → web)

Reference: standard tarot **2.75″ × 4.75″ (≈70×120 mm)**, ratio **≈11:19** (~0.58 width/height). Web softens slightly so long Chinese copy remains readable:

| Rule | Value | Why |
|------|-------|-----|
| Card width (desktop col) | ~260–300px | `container--wide` 920px ÷ 3 − gaps |
| Soft aspect | **≈5:7** (width:height ≈ 0.71) as *min* height guide | Between poker 5:7 and tall tarot 11:19; less empty for short copy |
| `min-height` | **400px** (~5:7 at 280px) | Floor; grid stretch equalizes row |
| Height grow | natural / equal height via grid | Never clip description |
| Outer radius | **16px** (`--radius-lg`) | Matches site cards |
| Foil ring | **2px** | Half-step allowed; thin “metal edge” only |
| Inner radius | **14px** | outer − foil |

#### Spacing (strict 8pt — no ad-hoc 5/10/18/72)

Vertical stack top → bottom (all tokens from §5):

| Region | Token | px |
|--------|-------|-----|
| Grid gap (desktop) | space-5 | 24 |
| Grid gap (mobile) | space-4 | 16 |
| Inner pad X | space-4 | 16 |
| Inner pad top / bottom | space-5 / space-4 | 24 / 16 |
| Top bar → sigil | space-4 | 16 |
| Sigil box | **64×64** (space-8) diamond outer | — |
| Sigil SVG | **40×40** | fits rotated diamond |
| Sigil → title | space-4 | 16 |
| Title → desc | space-3 | 12 |
| Desc → tags | space-3 | 12 |
| Tags → link rule | space-3 | 12 |
| Link rule padding-top | space-3 | 12 |
| Chip gap | space-2 | 8 |

Chrome: Roman numeral + first tag as suit; center geometric sigil (SVG, cycles by index); title → description → tags → link. Hover: lift **4px** (`space-1`) + stronger foil glow. `prefers-reduced-motion`: freeze foil shift + no lift.

### Writing ship log (`#writing`) — style **1 航行日志**

Home latest posts as a **star-trail timeline** (not a second constellation chart, not tarot cards):

- **Title / lead:** 「航行日志」+ 「按时间落下的观测记录」
- **Track:** 1px vertical gradient (cyan → blue → fade) at left; each entry a node (9px ring)
- **Now:** first (newest) node filled + soft cyan glow (`ship-log__item--now`)
- **Stack (8pt):** item pad-bottom space-5 (24); content inset-left 28px; stardate → title space-2; title → summary space-2; tags gap space-2, margin-top space-3
- **Stardate:** mono label「星历」+ `YYYY.MM.DD` (from post `date`)
- **CTA:** 「打开完整航海志 →」→ `/blog/` (blog index stays plain `.post-list`)
- **Motion:** none required; glow is static. Respect reduced-motion (no extra animation)

### Nav

- Sticky glass bar; bottom hairline; mute → ink on hover.

### Blog

- Prose max **680–720px**; code on solid surface-3 for contrast.

### Footer

- Mute; top hairline; transparent over sky.

## 5. Layout Principles

**Spacing scale** — **8pt grid** (half-step 4px allowed for hairline gaps only):

| Token | Value | Typical use |
|-------|-------|-------------|
| space-1 | 4px | Fine inset, icon nudge |
| space-2 | 8px | Chip gap, tight stack |
| space-3 | 12px | Small pad, card grid gap |
| space-4 | 16px | Default pad / list row |
| space-5 | 24px | Card padding, title margin |
| space-6 | 32px | Group separation |
| space-7 | 48px | Subsection / page-head |
| space-8 | 64px | Section vertical pad |
| space-9 | 80px | Hero pad, large breath |
| space-10 | 96px | Optional max breath |

Prefer multiples of 8 for `padding` / `margin` / `gap`. Do not invent one-off values like 72px when 64 or 80 fits.

| Layout | Value |
|--------|-------|
| Content max (home) | 760–840px |
| Content max (prose) | 680–720px |
| Page horizontal pad | 20–24px |
| Section vertical pad | space-8 (64px) default |
| Hero min height | `calc(100dvh - header)` — full first screen; next section below fold |
| Scroll cue | Bottom of `#hero` → `#doing` (mute chevron; no motion if reduced-motion) |

Main / header / footer: `position: relative; z-index: 1+`.

## 6. Depth & Elevation

| Level | Treatment |
|-------|-----------|
| 0 | canvas + starfield + nebula |
| 1 | glass card |
| 2 | solid surface-3 for code |

## 7. Do's and Don'ts

### Do

- Keep sky visible around and through UI chrome.
- Use cyan/blue accent sparingly (name, CTA, links).
- Copy from `content/site.yaml` and posts only.

### Don't

- Don't cover the full page with opaque charcoal panels.
- Don't add second brand colors (coral, mint, purple-primary).
- Don't reorder home sections without PAGE-CONTRACTS.
- Don't put secrets or heavy third-party trackers in the starfield script.

## 8. Responsive

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Single column; reduce star density; hero ~36–44px |
| ≥ 640px | 2-col cards optional |
| ≥ 960px | Comfortable section padding |

## 9. Agent Prompt Guide

```
Follow DESIGN.md starfield theme.
Canvas #050510, accent #38f9d7 / #60a5fa, glass cards, fixed #starfield canvas.
Home sections per PAGE-CONTRACTS.md. No Linear lavender primary.
```

## 10. Brand note

Public site name: **陈懂** (`content/site.yaml`).  
GitHub: `cuteLittleDevil` only.
