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
- Chinese system UI stack + Inter for Latin; quiet, personal, night-sky feel.

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
| body-md | 16px | 400 | Default |
| body-sm | 14px | 400 | Nav, cards |
| caption | 12–13px | 400 | Meta |

**Fonts**

- Display / UI Latin: `Inter`, system-ui  
- Chinese: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC"`  
- Code: `JetBrains Mono`, ui-monospace  

**Rules**

- Hero name may use cyan→blue **static gradient text** (no shimmer animation).
- Body line-height ≥ 1.65 on posts; hero bio readable over sky.
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

- Glass: translucent surface, 1px hairline, radius **14–16px**, padding 18–22px.
- Optional `backdrop-filter: blur(12px)`.
- Project title + summary + accent link.

### Nav

- Sticky glass bar; bottom hairline; mute → ink on hover.

### Blog

- Prose max **680–720px**; code on solid surface-3 for contrast.

### Footer

- Mute; top hairline; transparent over sky.

## 5. Layout Principles

| Token | Value |
|-------|-------|
| Base unit | 4px |
| Content max (home) | 760–840px |
| Content max (prose) | 680–720px |
| Page horizontal pad | 20–24px |
| Section gap | 56–88px |
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
