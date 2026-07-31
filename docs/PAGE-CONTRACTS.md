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

**Section order (fixed):**

| Order | `id` | Content source |
|------:|------|----------------|
| 1 | `#hero` | `profile.name`, `tagline`, `profile.bio`, `focus` chips, primary CTAs; full viewport under header |
| 2 | `#doing` | Sagittarius 12-star chart (3 bright poles from `doing[0..2]`); click pole → `#doing-dialog`; **below the fold** on first paint |
| 3 | `#projects` | `projects[]` as holographic-foil tarot cards (`.tarot-grid` / `.tarot-card`); face-up, no flip; spacing per DESIGN.md |
| 4 | `#writing` | latest N posts as **ship log** (`.ship-log` star-trail); title「航行日志」; CTA → `/blog/` |
| 5 | `#connect` | `social[]` (e.g. GitHub icon + label); do **not** spoil Earth easter egg |

Note: long bio on hero (`profile.bio`); WeChat/email only in Earth easter egg — never advertise the egg in copy.

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
