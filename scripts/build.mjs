#!/usr/bin/env node
/**
 * Static site builder: content/*.md + site.yaml + templates → dist/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");
const matter = require("gray-matter");
const { marked } = require("marked");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const contentDir = path.join(root, "content");
const postsDir = path.join(contentDir, "posts");
const stylesSrc = path.join(root, "src", "styles");
const jsSrc = path.join(root, "src", "js");
const previewsSrc = path.join(root, "design-previews");

marked.setOptions({ gfm: true, breaks: false });

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadSite() {
  const raw = fs.readFileSync(path.join(contentDir, "site.yaml"), "utf8");
  return yaml.load(raw);
}

function slugFromFilename(name) {
  const base = name.replace(/\.md$/i, "");
  const m = base.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return m ? m[1] : base;
}

/** Normalize frontmatter/YAML dates (string | Date) to YYYY-MM-DD */
function toDateString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateString(parsed);
  }
  return s.slice(0, 10);
}

function loadPosts() {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = [];
  for (const file of files) {
    const full = path.join(postsDir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);
    if (data.draft === true) continue;
    if (!data.title || !data.date) {
      console.warn(`[skip] ${file}: title and date required`);
      continue;
    }
    const slug = data.slug || slugFromFilename(file);
    const date = toDateString(data.date);
    posts.push({
      title: data.title,
      date,
      slug,
      summary: data.summary || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      body: content,
      html: marked.parse(content),
      url: `/blog/${slug}/`,
    });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

function absoluteUrl(baseUrl, path = "/") {
  const base = (baseUrl || "").replace(/\/$/, "");
  if (!base) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function renderEarthEgg(profile, egg) {
  if (!egg) return "";
  const contacts = Array.isArray(egg.contact) ? egg.contact : [];
  const contactHtml = contacts
    .map((c) => {
      const label = escapeHtml(c.label || "");
      const value = escapeHtml(c.value || "");
      if (c.href) {
        const ext = /^https?:/i.test(c.href)
          ? ` target="_blank" rel="noopener noreferrer"`
          : "";
        return `      <li><span class="earth-egg__label">${label}</span><a href="${escapeHtml(c.href)}"${ext}>${value}</a></li>`;
      }
      return `      <li><span class="earth-egg__label">${label}</span><span class="earth-egg__value" data-copy="${value}">${value}</span></li>`;
    })
    .join("\n");
  return `
<dialog class="earth-egg" id="earth-egg" aria-labelledby="earth-egg-title">
  <div class="earth-egg__panel">
    <button type="button" class="earth-egg__close" data-earth-egg-close aria-label="关闭">×</button>
    <p class="earth-egg__badge">${escapeHtml(egg.badge || "地球彩蛋")}</p>
    <div class="earth-egg__identity">
      <img class="earth-egg__avatar" src="${escapeHtml(profile.avatar)}" alt="" width="64" height="64" />
      <div>
        <h2 id="earth-egg-title">${escapeHtml(egg.title || profile.name)}</h2>
        <p class="earth-egg__handle">@${escapeHtml(profile.handle || "")}</p>
      </div>
    </div>
    <p class="earth-egg__intro">${escapeHtml(String(egg.intro || "").trim())}</p>
    <ul class="earth-egg__contact">
${contactHtml}
    </ul>
    <p class="earth-egg__tip">提示：再点一次地球可重新打开 · Esc 关闭</p>
  </div>
</dialog>`;
}

function layout({ site, profile, easterEgg, title, description, body, canonicalPath = "/" }) {
  const pageTitle =
    title === site.title ? site.title : `${title} · ${site.title}`;
  const desc = description || site.description || "";
  const canonical = absoluteUrl(site.baseUrl, canonicalPath);
  const canonicalTag = site.baseUrl
    ? `\n  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="${canonicalPath.startsWith("/blog/") && canonicalPath !== "/blog/" ? "article" : "website"}" />
  <meta property="og:site_name" content="${escapeHtml(site.title)}" />`
    : "";
  return `<!DOCTYPE html>
<html lang="${escapeHtml(site.language || "zh-CN")}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="author" content="${escapeHtml(site.author || profile.name)}" />${canonicalTag}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles/site.css" />
  <link rel="icon" href="${escapeHtml(profile.avatar)}" />
</head>
<body>
  <canvas class="starfield" id="starfield" aria-hidden="true"></canvas>
  <canvas class="solar-system" id="solar-system" aria-hidden="true"></canvas>
  <header class="site-header" id="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="/">
        <img class="brand__avatar" src="${escapeHtml(profile.avatar)}" alt="" width="28" height="28" />
        <span>${escapeHtml(profile.name)}</span>
      </a>
      <nav class="site-nav" aria-label="主导航">
        <a href="/#projects">作品</a>
        <a href="/blog/">博客</a>
        <a href="${escapeHtml(profile.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
      </nav>
    </div>
  </header>
  <main id="site-main">
${body}
  </main>
  <footer class="site-footer" id="site-footer">
    <div class="container">
      <p>© ${new Date().getFullYear()} ${escapeHtml(profile.name)}</p>
      <p>${escapeHtml((site.footer && site.footer.note) || "Powered by Markdown + Cloudflare Pages")}</p>
    </div>
  </footer>
${renderEarthEgg(profile, easterEgg)}
  <script src="/js/starfield.js" defer></script>
  <script src="/js/solar-system.js" defer></script>
  <script src="/js/scroll-hint.js" defer></script>
</body>
</html>
`;
}

function renderPostList(posts, { emptyText = "暂无文章" } = {}) {
  if (!posts.length) {
    return `<p class="empty">${escapeHtml(emptyText)}</p>`;
  }
  return `<ul class="post-list">
${posts
  .map(
    (p) => `    <li class="post-item">
      <a href="${escapeHtml(p.url)}">${escapeHtml(p.title)}</a>
      <div class="post-meta">
        <time datetime="${escapeHtml(p.date)}">${escapeHtml(p.date)}</time>
        ${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
      ${p.summary ? `<p class="post-summary">${escapeHtml(p.summary)}</p>` : ""}
    </li>`
  )
  .join("\n")}
  </ul>`;
}

function renderHome(siteData, posts) {
  const { site, profile, doing = [], projects = [], social = [] } = siteData;
  const latest = posts.slice(0, 5);

  const focusHtml = (profile.focus || []).length
    ? `<ul class="hero__focus">
${profile.focus.map((f) => `      <li>${escapeHtml(f)}</li>`).join("\n")}
    </ul>`
    : "";

  const doingHtml = doing
    .map(
      (d) => `      <article class="card">
        <h3>${escapeHtml(d.title)}</h3>
        <p>${escapeHtml(d.description)}</p>
      </article>`
    )
    .join("\n");

  const projectsHtml = projects
    .map(
      (p) => `      <article class="card">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description)}</p>
        ${(p.tags || []).length ? `<div class="tag-row">${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
        <a class="card__link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">查看项目 →</a>
      </article>`
    )
    .join("\n");

  const socialHtml = (social.length ? social : [{ label: "GitHub", url: profile.github }])
    .map(
      (s) =>
        `      <li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`
    )
    .join("\n");

  const body = `
    <section class="section" id="hero">
      <div class="container hero__inner">
        <span class="eyebrow">@${escapeHtml(profile.handle)}</span>
        <h1 class="hero__name">${escapeHtml(profile.name)}</h1>
        <p class="hero__tagline">${escapeHtml(profile.tagline)}</p>
        ${
          profile.bio
            ? `<p class="hero__bio">${escapeHtml(String(profile.bio).replaceAll("\n", " ").replace(/\s+/g, " ").trim())}</p>`
            : ""
        }
        <div class="btn-row">
          <a class="btn btn-primary" href="/blog/">阅读博客</a>
          <a class="btn btn-secondary" href="${escapeHtml(profile.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        ${focusHtml}
      </div>
      <a class="scroll-hint" href="#doing" aria-label="向下滚动，了解我在做什么">
        <span class="scroll-hint__label">向下了解</span>
        <span class="scroll-hint__arrow" aria-hidden="true"></span>
      </a>
    </section>

    <section class="section" id="doing">
      <div class="container">
        <h2 class="section-title">我在做什么</h2>
        <div class="card-grid card-grid--2">
${doingHtml}
        </div>
      </div>
    </section>

    <section class="section" id="projects">
      <div class="container">
        <h2 class="section-title">作品与开源</h2>
        <div class="card-grid card-grid--2">
${projectsHtml}
        </div>
      </div>
    </section>

    <section class="section" id="writing">
      <div class="container">
        <h2 class="section-title">最近写作</h2>
        ${renderPostList(latest)}
        <p class="section-more"><a href="/blog/">全部文章 →</a></p>
      </div>
    </section>

    <section class="section" id="connect">
      <div class="container">
        <h2 class="section-title">在这里找到我</h2>
        <ul class="social-list">
${socialHtml}
        </ul>
      </div>
    </section>
`;

  return layout({
    site: { ...site, footer: siteData.footer },
    profile,
    easterEgg: siteData.easterEgg,
    title: site.title,
    description: site.description,
    body,
    canonicalPath: "/",
  });
}

function renderBlogIndex(siteData, posts) {
  const { site, profile } = siteData;
  const body = `
    <div class="page-head">
      <div class="container">
        <h1>博客</h1>
        <p class="hero__tagline" style="margin:0">技术笔记与工程记录 · Markdown 直出</p>
      </div>
    </div>
    <div class="section" style="padding-top:0">
      <div class="container">
        ${renderPostList(posts)}
      </div>
    </div>
`;
  return layout({
    site: { ...site, footer: siteData.footer },
    profile,
    easterEgg: siteData.easterEgg,
    title: "博客",
    description: `${profile.name} 的技术博客`,
    body,
    canonicalPath: "/blog/",
  });
}

function renderPost(siteData, post) {
  const { site, profile } = siteData;
  const tags = post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const body = `
    <article class="page-head">
      <div class="container-prose">
        <a class="back-link" href="/blog/">← 返回博客</a>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="article-meta">
          <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
          ${tags ? ` · ${tags}` : ""}
        </div>
      </div>
      <div class="container-prose prose">
        ${post.html}
      </div>
    </article>
`;
  return layout({
    site: { ...site, footer: siteData.footer },
    profile,
    easterEgg: siteData.easterEgg,
    title: post.title,
    description: post.summary || site.description,
    body,
    canonicalPath: post.url,
  });
}

function buildCssBundle() {
  const tokens = fs.readFileSync(path.join(stylesSrc, "tokens.css"), "utf8");
  let site = fs.readFileSync(path.join(stylesSrc, "site.css"), "utf8");
  // Inline tokens instead of @import for single-file deploy simplicity
  site = site.replace(/@import\s+["']\.\/tokens\.css["']\s*;\s*/m, `${tokens}\n\n`);
  return site;
}

function main() {
  console.log("Building site…");
  rmrf(dist);
  ensureDir(dist);

  const siteData = loadSite();
  // normalize footer onto site for layout convenience
  siteData.site.footer = siteData.footer;
  const posts = loadPosts();

  writeFile(path.join(dist, "index.html"), renderHome(siteData, posts));
  writeFile(path.join(dist, "blog", "index.html"), renderBlogIndex(siteData, posts));

  for (const post of posts) {
    writeFile(path.join(dist, "blog", post.slug, "index.html"), renderPost(siteData, post));
  }

  writeFile(path.join(dist, "styles", "site.css"), buildCssBundle());
  // keep tokens available for debugging / future splits
  fs.copyFileSync(path.join(stylesSrc, "tokens.css"), path.join(dist, "styles", "tokens.css"));

  // starfield + any progressive JS
  copyDir(jsSrc, path.join(dist, "js"));

  // optional style gallery for local comparison (also deployed for easy review)
  copyDir(previewsSrc, path.join(dist, "design-previews"));

  // Cloudflare Pages SPA fallback not needed; add simple headers optional
  writeFile(
    path.join(dist, "_headers"),
    `/styles/*
  Cache-Control: public, max-age=31536000, immutable
/js/*
  Cache-Control: public, max-age=31536000, immutable
`
  );

  const baseUrl = (siteData.site.baseUrl || "").replace(/\/$/, "");
  if (baseUrl) {
    const urls = ["/", "/blog/", ...posts.map((p) => p.url)];
    const lastmod = new Date().toISOString().slice(0, 10);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeHtml(absoluteUrl(baseUrl, u))}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;
    writeFile(path.join(dist, "sitemap.xml"), sitemap);
    writeFile(
      path.join(dist, "robots.txt"),
      `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`
    );
  }

  console.log(`Done. ${posts.length} post(s) → ${path.relative(root, dist)}/`);
  if (baseUrl) console.log(`  baseUrl: ${baseUrl}`);
  for (const p of posts) {
    console.log(`  - ${p.date} ${p.slug}`);
  }
}

main();
