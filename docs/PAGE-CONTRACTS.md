# Page Contracts

Agents and humans must preserve these structural contracts.  
Visual tokens: `DESIGN.md`. Data: `content/*`.

---

## Global chrome

Every public page includes:

1. `<html lang="zh-CN">`
2. Meta: charset, viewport, title, description
3. Link to site CSS (`/styles/site.css` or bundled path under `dist/styles/`)
4. **Header** `#site-header`
   - Brand link → `/`
   - Nav links: 首页 (optional), 博客, GitHub (external)
5. **Main** `#site-main`
6. **Footer** `#site-footer`

### Forbidden

- Extra top promo banners
- Floating chat widgets
- Inline style attributes for brand colors (use classes + CSS variables)

---

## Home `/`

**Narrative:** one night voyage — see `DESIGN.md` §0 Starfield narrative (观测台 → 作品手牌 → 航行日志 → 地面站).  
**Section order (fixed); `id` stable for anchors/nav:**

| Order | `id` | Display title | Content / UI |
|------:|------|---------------|--------------|
| 1 | `#hero` | (name) | `profile.*`, focus chips, CTAs; full viewport under header |
| 2 | `#doing` | **观测台** | **Capricornus (摩羯座)** stick figure (α/ι/δ poles + main Bayer stars); `doing[0..2]`; lead = `doingLead`; click → `#doing-dialog`; **below the fold** |
| 3 | `#projects` | **作品手牌** | `projects[]` foil tarot (`.tarot-grid`); no lead; suit prefers distinctive tag over generic lang |
| 4 | `#writing` | **航行日志** | latest N posts (`.ship-log`); no lead; CTA「打开完整航海志 →」`/blog/` |
| 5 | `#connect` | **地面站** | `social[]`; no lead; **do not** spoil Earth easter egg |

Note: optional bio on hero (`profile.bio`); focus chips may link via optional `url`. WeChat/email only in Earth easter egg — never advertise the egg in copy.

Hero CTAs:

1. Primary → `/blog/`
2. Secondary → GitHub profile
3. Scroll hint (not a primary CTA) → `#doing` — chevron only; `aria-label` e.g.「继续浏览」(no visible label)

Fold rule: first viewport must not show `#doing` section title (desktop 1440×900 / 1920×1080 and typical mobile).

---

## Blog index `/blog/`

- H1: 博客 / Writing
- Lead: `.page-lead` (no inline styles)
- List in `.section.section--tight-top`
- Ordered list or stacked rows of posts (newest first)
- Each row: title (link), date, summary (if any), tags
- Empty state: short line “暂无文章” if no posts
- No solar-system canvas / egg scripts (home only)

---

## Blog post `/blog/{slug}/`

- Back link → `/blog/`
- H1 = post title
- Meta line: date · tags
- Article body in `.prose`
- No author box required (single-author site)

---

## HTML constraints

| Rule | Detail |
|------|--------|
| Semantic tags | `header`, `main`, `footer`, `article`, `section` |
| Headings | One `h1` per page |
| Images | `alt` required; avatar decorative may use empty alt only if adjacent name text exists |
| External links | `rel="noopener noreferrer"` when `target="_blank"` |
| Paths | Root-absolute paths in dist (`/blog/…`, `/styles/…`) |

---

## Class naming (stable)

Prefer:

- `.site-header`, `.site-nav`, `.btn`, `.btn-primary`, `.btn-secondary`
- `.card`, `.card-grid` (legacy glass); projects use `.tarot-grid`, `.tarot-card`
- `.post-list`, `.post-item`, `.prose`
- `.section`, `.section-title`, `.container`

Do not BEM-explode without need; keep class set small for agent stability.

---

## Design preview pages

`design-previews/*` are **not** bound to these contracts. They are selection tools only. Production pages follow this document.
