# Content Model

All visitor-facing prose and project data live under `content/`.  
**Templates must not hardcode long copy** that belongs here.

---

## 1. `content/site.yaml`

```yaml
site:
  title: string          # <title> + brand
  description: string    # meta description
  language: zh-CN
  baseUrl: string        # production URL, no trailing slash — e.g. https://cute-little-devil.com
  author: string

profile:
  name: string
  handle: string         # GitHub login
  tagline: string
  avatar: string         # URL
  github: string         # profile URL
  bio: string            # short paragraph, markdown-ish plain text OK
  focus: string[]        # chips / bullets under hero or about

timeline:                # optional about timeline
  - year: string
    text: string

doingLead: string        # optional one-line under section title (e.g. 观测三角 · …)
doing:                   # “我在做什么” — first 3 items → bright poles (left / top / right); click opens dialog
  - role: string         # optional pole label (e.g. 造镜 / 校准 / 星志)
    title: string        # shown on chart + dialog
    description: string  # dialog body only

projects:
  - name: string
    description: string
    url: string
    tags: string[]       # optional

social:
  - label: string
    url: string

# optional — Earth click easter egg in solar-system canvas
easterEgg:
  badge: string
  title: string
  intro: string
  contact:
    - label: string
      value: string
      href: string       # optional (tel: / mailto: / https:)

footer:
  note: string           # optional
```

### Validation rules

- `profile.name`, `profile.tagline`, `profile.github` required.
- Each `projects[]` needs `name`, `description`, `url`.
- URLs should be absolute `https://…`.

---

## 2. Blog posts — `content/posts/*.md`

**Filename:** prefer `yyyy-mm-dd-slug.md` (slug used if frontmatter slug missing).

### Frontmatter

```yaml
---
title: string            # required
date: YYYY-MM-DD         # required
slug: string             # optional; default from filename
summary: string          # optional; list excerpt
tags: string[]           # optional
draft: boolean           # default false; draft=true excluded from build
---
```

### Body

- GitHub-flavored Markdown.
- Relative images: place under `content/posts/assets/` or `src/assets/` and reference paths the build supports (v1: use absolute HTTPS images or paths under `/assets/` after copy).
- No raw `<script>`; build may strip or leave as-is — **author must not inject scripts**.

### Publishing flow (author)

1. Add or edit `content/posts/yyyy-mm-dd-my-note.md`
2. Commit & push to `main` (or PR then merge)
3. GitHub Action builds and deploys to Cloudflare
4. Post appears at `/blog/{slug}/`

---

## 3. What not to put in content

- CSS colors / layout numbers → `DESIGN.md` / `tokens.css`
- HTML chrome (nav labels can be template defaults or `site.yaml` if i18n needed)
- Cloudflare / API tokens

---

## 4. Example post skeleton

```markdown
---
title: 示例：为什么用 Markdown 写技术笔记
date: 2026-07-30
slug: markdown-notes-pipeline
summary: 用 GitHub + Actions + Cloudflare 自动发布静态博客。
tags: [workflow, blog]
---

## 背景

……
```
