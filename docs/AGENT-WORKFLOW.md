# Agent Workflow — Generating & Updating This Site

This is the **recommended pipeline** for agent-generated websites in 2025–2026, specialized for this repo.

---

## Why constraints-first

LLMs are good at filling structure, bad at remembering brand over many turns.  
**Markdown contracts** (DESIGN / SDD / PAGE / CONTENT) are the cheapest, most portable memory:

| File | Agent reads when… |
|------|-------------------|
| `DESIGN.md` | Any visual / CSS / component change |
| `docs/PAGE-CONTRACTS.md` | Adding sections, changing DOM order |
| `docs/CONTENT-MODEL.md` | New fields, post format |
| `docs/SDD.md` | Deploy, stack, non-goals |
| `content/*` | Copy, projects, posts |

---

## Standard pipeline

```text
1. Constraints    DESIGN + SDD + PAGE-CONTRACTS + CONTENT-MODEL
2. Content data   site.yaml + posts/*.md
3. Generate shell templates + tokens.css + build.mjs
4. Build verify   npm run build → inspect dist/
5. Deploy CI      push → Actions → Cloudflare Pages
6. Incremental
   - New post     → only content/posts
   - Bio/project  → only site.yaml
   - Look & feel  → DESIGN.md then tokens/CSS
   - New page type→ PAGE-CONTRACTS first, then template + build
```

### Golden rules

1. **Never invent a second design system** mid-task.
2. **Content vs chrome:** long text only in `content/`.
3. **One source of color:** CSS variables from tokens.
4. **Build must succeed** before claiming done.
5. **Do not commit secrets**; document required GitHub secrets only.
6. **No private content of others** — do not fetch, scrape, copy, or publish private repos, authenticated dashboards, tokens/cookies, other people's PII, or paywalled/internal docs. Use only public references and this repo's `content/` (or text the owner pastes). If private material seems required, stop and ask the owner.
7. **Never `git add` / `commit` / `push` without explicit user confirmation that turn** — show file list + commit message preview first; wait for 确认/可以提交. Soft “ok/continue” is not enough. See `CLAUDE.md` §提交代码前必须先问用户.

---

## Task routing matrix

| User intent | Touch | Do not touch |
|-------------|-------|--------------|
| 发博客 / 改笔记 | `content/posts/**` | templates, CSS |
| 改简介 / 项目 | `content/site.yaml` | layout order |
| 微调间距颜色 | `DESIGN.md` + `src/styles/*` | post markdown |
| 加新首页区块 | `PAGE-CONTRACTS.md` → templates → build | random DOM |
| 换风格 | rewrite DESIGN + tokens; keep contracts | redesign IA |
| 修 CI 部署 | `.github/workflows/*`, README secrets | content |

---

## Generation prompt pattern (copy-paste)

```
Read DESIGN.md, docs/PAGE-CONTRACTS.md, docs/CONTENT-MODEL.md, docs/SDD.md, CLAUDE.md.
Implement only the requested change.
Use content from content/site.yaml and content/posts (owner-provided only).
Run npm run build and fix errors.
Do not add new brand colors. Do not reorder home sections without updating PAGE-CONTRACTS.md.
Do not fetch private repos, auth-gated pages, others' PII, or secrets.
Do not git commit or push unless the user explicitly confirmed this turn.
```

---

## Verification checklist

- [ ] `npm run build` exits 0
- [ ] `dist/index.html` has sections `#hero` … `#connect` in order
- [ ] Hero fills first screen; scroll-hint present; `#doing` not on first paint (fold rule)
- [ ] New post appears in `dist/blog/index.html` and has its own folder
- [ ] No raw hex in templates except if unavoidable; prefer `var(--…)`
- [ ] External GitHub links work
- [ ] Style previews still optional under `design-previews/`
- [ ] No private third-party content or others' PII introduced without owner-provided `content/`

---

## Cloudflare + GitHub Action expectations

Agent may create/update workflow YAML, but **must not** embed API tokens.  
Document:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- Project name default: `website` (change in workflow if needed)

Author flow remains: **Markdown on GitHub → Action → Cloudflare**.

---

## Anti-patterns (seen in vibe-coded sites)

- Regenerating whole site for one blog post
- Different fonts/colors per page
- Duplicating biography in HTML and YAML
- Committing `dist/` as only source of truth without content files
- Using a heavy framework for a 5-page personal site without need
- Scraping private GitHub repos / logged-in dashboards / internal docs “for reference”
- Pulling someone else’s phone, WeChat, email, or tokens into this site without the owner writing them in `content/`
- Bypassing auth (cookies, leaked URLs, guessing private paths) to “make it work”
