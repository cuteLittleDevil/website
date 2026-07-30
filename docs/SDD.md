# SDD — Personal Website

**Status:** Active  
**Last updated:** 2026-07-30  
**Owner:** cuteLittleDevil  
**Public name:** 陈懂  

---

## 1. Purpose

Build a personal site similar in information architecture to [stormzhang.ai](https://stormzhang.ai/): identity, focus areas, open-source work, and a growing **markdown blog**. Deploy as a static site on **Cloudflare Pages**, with content authored on **GitHub** and published via **GitHub Actions**.

Public display name is **陈懂**; GitHub identity remains `cuteLittleDevil`.  
Production domain: **https://cute-little-devil.com**.

## 2. Goals

| ID | Goal |
|----|------|
| G1 | Static HTML site with fixed visual constraints (Linear-inspired DESIGN.md) |
| G2 | Write posts as Markdown under `content/posts/`; no CMS |
| G3 | `npm run build` produces deployable `dist/` |
| G4 | Push to `main` → GitHub Action build → Cloudflare Pages |
| G5 | Agents can regenerate or extend UI only by following design/content contracts |

## 3. Non-goals

- Comment system, user accounts, search backend
- Headless CMS / Notion sync (v1)
- SSR / edge dynamic rendering
- Multi-author workflows
- Pixel-perfect clone of stormzhang.ai or Linear product marketing

## 4. Users & content flows

| Actor | Flow |
|-------|------|
| Visitor | Browse home → projects → blog list → post |
| Author (you) | Edit/add `content/posts/*.md` → commit → push → auto deploy |
| Agent | Read DESIGN + contracts → change templates/styles/build → never invent content colors |

## 5. Architecture

```
content/site.yaml          ──┐
content/posts/*.md         ──┼──► scripts/build.mjs ──► dist/** ──► Cloudflare Pages
templates/*.html           ──┤
src/styles/*.css           ──┘
         ▲
         │  CI
GitHub push (main) → Actions: npm ci && npm run build → pages deploy
```

| Layer | Responsibility |
|-------|----------------|
| Content | Facts: profile, projects, posts (YAML + Markdown) |
| Templates | HTML structure; placeholders only |
| Tokens CSS | Visual system locked to DESIGN.md |
| Build | Parse MD, render pages, copy static assets |
| Deploy | Cloudflare Pages from `dist/` |

## 6. Tech stack

| Concern | Choice |
|---------|--------|
| Output | Static HTML + CSS (+ minimal progressive JS only if needed) |
| Build | Node.js script (`scripts/build.mjs`) |
| Markdown | `marked` |
| Frontmatter | `gray-matter` |
| Site config | `js-yaml` → `content/site.yaml` |
| Hosting | Cloudflare Pages |
| CI | GitHub Actions (`cloudflare/wrangler-action` or pages-action) |

**Why not Astro/Next:** fewer moving parts for agent regeneration; content → HTML is enough.

## 7. URL map

Base: `https://cute-little-devil.com` (`site.baseUrl`)

| Path | Source |
|------|--------|
| `/` | Home from `site.yaml` + latest posts |
| `/blog/` | All posts index |
| `/blog/{slug}/` | Single post |
| `/sitemap.xml` | Generated when `baseUrl` set |
| `/robots.txt` | Generated when `baseUrl` set |
| `/design-previews/` | Style comparison (optional in dist; can copy for reference) |

## 8. Deployment (Cloudflare + GitHub)

1. Create Cloudflare Pages project (e.g. `website`), production branch `main` **or** deploy-only via Action.
2. Configure GitHub secrets:
   - `CLOUDFLARE_API_TOKEN` — Pages edit permission
   - `CLOUDFLARE_ACCOUNT_ID`
3. Workflow (see `.github/workflows/deploy.yml`): checkout → setup Node → `npm ci` → `npm run build` → upload `dist/`.
4. Authoring loop: write Markdown → push → wait for green Action → live site updates.

**Local preview:** `npm run build && npx serve dist`

## 9. Security & ops

- No secrets in repo; only GH Actions secrets.
- No user-generated HTML without sanitization (author-trusted Markdown only).
- `dist/` is build artifact — gitignored or overwritable; source of truth is content + templates.

## 10. Open decisions / future

- Custom domain on Cloudflare
- RSS feed generation in build
- Tag pages if post volume grows
- Optional alternate theme (e.g. light Vercel) via tokens rewrite + DESIGN.md

## 11. Related docs

| Doc | Role |
|-----|------|
| `DESIGN.md` | Visual tokens & components |
| `docs/CONTENT-MODEL.md` | YAML + post schema |
| `docs/PAGE-CONTRACTS.md` | DOM/section contracts |
| `docs/AGENT-WORKFLOW.md` | How agents must work |
| `design-previews/` | Style A/B HTML |
