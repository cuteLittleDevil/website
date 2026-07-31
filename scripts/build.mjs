#!/usr/bin/env node
/**
 * Static site builder: content/*.md + site.yaml + templates → dist/
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
const assetsSrc = path.join(root, "src", "assets");

marked.setOptions({ gfm: true, breaks: false });

/** Short content hash for cache-busting unhashed static URLs on Cloudflare. */
function shortHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 10);
}

function fileHash(filePath) {
  return shortHash(fs.readFileSync(filePath));
}

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

function socialIcon(label) {
  const key = String(label || "").toLowerCase();
  if (key.includes("github")) {
    return `<svg class="social-link__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>`;
  }
  return "";
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
    <p class="earth-egg__tip">Esc 关闭</p>
  </div>
</dialog>`;
}

function layout({
  site,
  profile,
  easterEgg,
  title,
  description,
  body,
  canonicalPath = "/",
  homeChrome = false,
  assetV = "0",
}) {
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
  const v = escapeHtml(assetV);
  const solarCanvas = homeChrome
    ? `\n  <canvas class="solar-system" id="solar-system" aria-hidden="true"></canvas>`
    : "";
  const homeScripts = homeChrome
    ? `
  <script src="/js/solar-system.js?v=${v}" defer></script>
  <script src="/js/scroll-hint.js?v=${v}" defer></script>
  <script src="/js/doing-sky.js?v=${v}" defer></script>`
    : "";
  return `<!DOCTYPE html>
<html lang="${escapeHtml(site.language || "zh-CN")}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="author" content="${escapeHtml(site.author || profile.name)}" />${canonicalTag}
  <link rel="stylesheet" href="/styles/site.css?v=${v}" />
  <link rel="icon" href="${escapeHtml(profile.avatar)}" />
</head>
<body>
  <canvas class="starfield" id="starfield" aria-hidden="true"></canvas>${solarCanvas}
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
${homeChrome ? renderEarthEgg(profile, easterEgg) : ""}
  <script src="/js/starfield.js" defer></script>${homeScripts}
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

/**
 * Sagittarius chart for #doing — poles aligned to sagittarius-bg.jpg
 * (horizontally flipped: bow aims left; object-fit contain → image 1000×562.5, y0≈119).
 *
 * Poles (left → mid → right):
 *   [0] 造镜 — arrow tip (left)
 *   [1] 校准 — draw arm (mid-left)
 *   [2] 星志 — right upper (horse croup / withers)
 */
function renderDoingConstellation(doing = [], assetV = "0") {
  const poles = [0, 1, 2].map((i) => {
    const d = doing[i] || {};
    const role = String(d.role || "");
    const title = String(d.title || `事项 ${i + 1}`);
    const description = String(d.description || "");
    return {
      role,
      title,
      description,
      roleHtml: role ? escapeHtml(role) : "",
      titleHtml: escapeHtml(title),
      descriptionHtml: description ? escapeHtml(description) : "",
      roleAttr: escapeHtml(role),
      titleAttr: escapeHtml(title),
      descriptionAttr: escapeHtml(description),
    };
  });

  const ariaParts = poles
    .map((p) => (p.role ? `${p.roleHtml}：${p.titleHtml}` : p.titleHtml))
    .join("；");

  const label = (p, roleFill) =>
    `${
      p.roleHtml
        ? `<text class="doing-sky__role" text-anchor="middle" y="-4" fill="${roleFill}" font-size="11" letter-spacing="0.14em">${p.roleHtml}</text>`
        : ""
    }
            <text class="doing-sky__title" text-anchor="middle" y="${p.roleHtml ? "16" : "4"}" fill="rgba(230,237,243,0.92)" font-size="15" font-weight="600">${p.titleHtml}</text>`;

  const poleAttrs = (p, index) => {
    const name = p.role ? `${p.roleHtml}：${p.titleHtml}` : p.titleHtml;
    return `class="doing-sky__pole doing-sky__pole--${index}" role="button" tabindex="0" data-doing-pole data-role="${p.roleAttr}" data-title="${p.titleAttr}" data-description="${p.descriptionAttr}" aria-label="${name}，查看详情"`;
  };

  return `
      <div class="doing-sky">
        <img
          class="doing-sky__bg"
          src="/assets/sagittarius-bg.jpg?v=${escapeHtml(assetV)}"
          alt=""
          width="1280"
          height="720"
          decoding="async"
          aria-hidden="true"
        />
        <svg class="doing-sky__svg" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="射手座星图：${ariaParts}。点击高亮星点查看详情">
          <defs>
            <radialGradient id="doing-dim" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#e6edf3" stop-opacity="0.95"/>
              <stop offset="40%" stop-color="rgba(148,180,220,0.45)"/>
              <stop offset="100%" stop-color="rgba(148,180,220,0)"/>
            </radialGradient>
            <radialGradient id="doing-bright" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
              <stop offset="22%" stop-color="#38f9d7" stop-opacity="0.9"/>
              <stop offset="55%" stop-color="#60a5fa" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
            </radialGradient>
            <filter id="doing-blur-wide" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="10"/>
            </filter>
            <filter id="doing-text-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b"/>
              <feFlood flood-color="#050510" flood-opacity="0.75" result="c"/>
              <feComposite in="c" in2="b" operator="in" result="s"/>
              <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!--
            Flipped plate (bow aims left). viewBox x mirrored: x' = 1000 - x
            造镜 arrow ~ (260, 316); 校准 arm ~ (440, 340); 星志 croup ~ (700, 355)
          -->
          <g class="doing-sky__links" fill="none" stroke="rgba(186,210,240,0.28)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <!-- haunch → 星志 (croup) → chest → head -->
            <path d="M715 500 L 700 355 L 580 340 L 490 300"/>
            <!-- head → 校准 (draw arm) → bow grip → arrow tip 造镜 (left) -->
            <path d="M490 300 L 440 340 L 340 330 L 260 316"/>
            <!-- bow curve accents -->
            <path d="M340 330 L 290 250 L 260 316"/>
            <path d="M340 330 L 300 420 L 260 316" opacity="0.75"/>
            <!-- horse span: 星志 → mid → 校准 -->
            <path d="M700 355 L 620 400 L 520 390 L 440 340"/>
            <!-- legs drop -->
            <path d="M620 400 L 660 560" opacity="0.7"/>
            <path d="M520 390 L 500 560" opacity="0.7"/>
            <!-- tail -->
            <path d="M700 355 L 760 420 L 715 500" opacity="0.65"/>
          </g>

          <g class="doing-sky__dim" aria-hidden="true">
            <circle cx="580" cy="340" r="10" fill="url(#doing-dim)"/><circle cx="580" cy="340" r="2.2" fill="rgba(232,238,248,0.9)"/>
            <circle cx="490" cy="300" r="11" fill="url(#doing-dim)"/><circle cx="490" cy="300" r="2.4" fill="rgba(232,238,248,0.9)"/>
            <circle cx="340" cy="330" r="11" fill="url(#doing-dim)"/><circle cx="340" cy="330" r="2.4" fill="rgba(232,238,248,0.9)"/>
            <circle cx="290" cy="250" r="9" fill="url(#doing-dim)"/><circle cx="290" cy="250" r="2.1" fill="rgba(232,238,248,0.9)"/>
            <circle cx="300" cy="420" r="9" fill="url(#doing-dim)"/><circle cx="300" cy="420" r="2.1" fill="rgba(232,238,248,0.9)"/>
            <circle cx="620" cy="400" r="10" fill="url(#doing-dim)"/><circle cx="620" cy="400" r="2.2" fill="rgba(232,238,248,0.9)"/>
            <circle cx="520" cy="390" r="10" fill="url(#doing-dim)"/><circle cx="520" cy="390" r="2.2" fill="rgba(232,238,248,0.9)"/>
            <circle cx="660" cy="560" r="9" fill="url(#doing-dim)"/><circle cx="660" cy="560" r="2.1" fill="rgba(232,238,248,0.9)"/>
            <circle cx="500" cy="560" r="9" fill="url(#doing-dim)"/><circle cx="500" cy="560" r="2.1" fill="rgba(232,238,248,0.9)"/>
            <circle cx="760" cy="420" r="9" fill="url(#doing-dim)"/><circle cx="760" cy="420" r="2.1" fill="rgba(232,238,248,0.9)"/>
            <circle cx="715" cy="500" r="9" fill="url(#doing-dim)"/><circle cx="715" cy="500" r="2.1" fill="rgba(232,238,248,0.9)"/>
          </g>

          <!-- [0] 造镜 — arrow tip (left) -->
          <g ${poleAttrs(poles[0], 0)}>
            <g class="doing-sky__pole-glow" aria-hidden="true">
              <circle cx="260" cy="316" r="38" fill="url(#doing-bright)" filter="url(#doing-blur-wide)"/>
              <circle cx="260" cy="316" r="18" fill="url(#doing-bright)"/>
            </g>
            <circle class="doing-sky__pole-core" cx="260" cy="316" r="4.8" fill="#fff" aria-hidden="true"/>
            <circle class="doing-sky__pole-core" cx="260" cy="316" r="1.9" fill="#38f9d7" aria-hidden="true"/>
            <g class="doing-sky__label" transform="translate(260, 250)" filter="url(#doing-text-glow)" aria-hidden="true">
              ${label(poles[0], "#38f9d7")}
            </g>
            <circle class="doing-sky__hit" cx="260" cy="316" r="52" fill="transparent"/>
          </g>

          <!-- [1] 校准 — draw arm (mid-left); label slightly above to clear 造镜 -->
          <g ${poleAttrs(poles[1], 1)}>
            <g class="doing-sky__pole-glow" aria-hidden="true">
              <circle cx="440" cy="340" r="36" fill="url(#doing-bright)" filter="url(#doing-blur-wide)"/>
              <circle cx="440" cy="340" r="17" fill="url(#doing-bright)"/>
            </g>
            <circle class="doing-sky__pole-core" cx="440" cy="340" r="4.8" fill="#fff" aria-hidden="true"/>
            <circle class="doing-sky__pole-core" cx="440" cy="340" r="1.9" fill="#38f9d7" aria-hidden="true"/>
            <g class="doing-sky__label" transform="translate(440, 274)" filter="url(#doing-text-glow)" aria-hidden="true">
              ${label(poles[1], "#7dd3fc")}
            </g>
            <circle class="doing-sky__hit" cx="440" cy="340" r="52" fill="transparent"/>
          </g>

          <!-- [2] 星志 — right upper (croup / withers) -->
          <g ${poleAttrs(poles[2], 2)}>
            <g class="doing-sky__pole-glow" aria-hidden="true">
              <circle cx="700" cy="355" r="36" fill="url(#doing-bright)" filter="url(#doing-blur-wide)"/>
              <circle cx="700" cy="355" r="17" fill="url(#doing-bright)"/>
            </g>
            <circle class="doing-sky__pole-core" cx="700" cy="355" r="4.8" fill="#fff" aria-hidden="true"/>
            <circle class="doing-sky__pole-core" cx="700" cy="355" r="1.9" fill="#60a5fa" aria-hidden="true"/>
            <g class="doing-sky__label" transform="translate(700, 290)" filter="url(#doing-text-glow)" aria-hidden="true">
              ${label(poles[2], "#7dd3fc")}
            </g>
            <circle class="doing-sky__hit" cx="700" cy="355" r="52" fill="transparent"/>
          </g>
        </svg>
      </div>
      <dialog class="doing-dialog" id="doing-dialog" aria-labelledby="doing-dialog-title">
        <div class="doing-dialog__panel">
          <button type="button" class="doing-dialog__close" data-doing-dialog-close aria-label="关闭">×</button>
          <p class="doing-dialog__role" id="doing-dialog-role" hidden></p>
          <h3 class="doing-dialog__title" id="doing-dialog-title"></h3>
          <p class="doing-dialog__desc" id="doing-dialog-desc"></p>
          <p class="doing-dialog__tip">Esc 关闭 · 点击外部关闭</p>
        </div>
      </dialog>`;
}

function renderHome(siteData, posts, assetV = "0") {
  const { site, profile, doing = [], doingLead, projects = [], social = [] } = siteData;
  const latest = posts.slice(0, 5);

  const socialHtml = (social.length ? social : [{ label: "GitHub", url: profile.github }])
    .map(
      (s) =>
        `      <li><a class="social-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(s.label)}">${socialIcon(s.label)}${escapeHtml(s.label)}</a></li>`
    )
    .join("\n");

  const focusHtml = (profile.focus || []).length
    ? `<ul class="hero__focus">
${profile.focus.map((f) => `      <li>${escapeHtml(f)}</li>`).join("\n")}
    </ul>`
    : "";

  const doingLeadHtml = doingLead
    ? `<p class="section-lead">${escapeHtml(doingLead)}</p>`
    : "";

  const doingBlock = renderDoingConstellation(doing, assetV);

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

  const body = `
    <section class="section" id="hero">
      <div class="container hero__inner">
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
      <a class="scroll-hint" href="#doing" aria-label="继续浏览">
        <span class="scroll-hint__arrow" aria-hidden="true"></span>
      </a>
    </section>

    <section class="section" id="doing">
      <div class="container container--wide">
        <h2 class="section-title">我在做什么</h2>
        ${doingLeadHtml}
${doingBlock}
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
    homeChrome: true,
    assetV,
  });
}

function renderBlogIndex(siteData, posts, assetV = "0") {
  const { site, profile } = siteData;
  const body = `
    <div class="page-head">
      <div class="container">
        <h1>博客</h1>
        <p class="page-lead">技术笔记与工程记录 · Markdown 直出</p>
      </div>
    </div>
    <div class="section section--tight-top">
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
    homeChrome: false,
    assetV,
  });
}

function renderPost(siteData, post, assetV = "0") {
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
    homeChrome: false,
    assetV,
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

  // Build CSS first so HTML can cache-bust with content hash (Cloudflare immutable static).
  const cssBundle = buildCssBundle();
  const stampParts = [cssBundle];
  for (const name of ["solar-system.js", "scroll-hint.js", "doing-sky.js", "starfield.js"]) {
    stampParts.push(fs.readFileSync(path.join(jsSrc, name)));
  }
  const bgPath = path.join(assetsSrc, "sagittarius-bg.jpg");
  if (fs.existsSync(bgPath)) stampParts.push(fs.readFileSync(bgPath));
  const assetV = shortHash(Buffer.concat(stampParts.map((p) => Buffer.from(p))));

  writeFile(path.join(dist, "index.html"), renderHome(siteData, posts, assetV));
  writeFile(path.join(dist, "blog", "index.html"), renderBlogIndex(siteData, posts, assetV));

  for (const post of posts) {
    writeFile(path.join(dist, "blog", post.slug, "index.html"), renderPost(siteData, post, assetV));
  }

  writeFile(path.join(dist, "styles", "site.css"), cssBundle);
  // keep tokens available for debugging / future splits
  fs.copyFileSync(path.join(stylesSrc, "tokens.css"), path.join(dist, "styles", "tokens.css"));

  // starfield + progressive JS
  copyDir(jsSrc, path.join(dist, "js"));

  // static images (e.g. sagittarius backdrop)
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(dist, "assets"));
  }

  // design-previews stay local only (not published to dist / production)

  // Long-cache is OK: HTML references use ?v=<content-hash> so deploys bust clients.
  writeFile(
    path.join(dist, "_headers"),
    `/styles/*
  Cache-Control: public, max-age=31536000, immutable
/js/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`
  );

  writeFile(
    path.join(dist, "404.html"),
    layout({
      site: { ...siteData.site, footer: siteData.footer },
      profile: siteData.profile,
      easterEgg: siteData.easterEgg,
      title: "页面不存在",
      description: "404",
      body: `
    <div class="page-head">
      <div class="container">
        <h1>404</h1>
        <p class="page-lead">这个地址没有内容。</p>
        <p class="section-more"><a href="/">回首页</a> · <a href="/blog/">博客</a></p>
      </div>
    </div>
`,
      canonicalPath: "/404.html",
      homeChrome: false,
      assetV,
    })
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
