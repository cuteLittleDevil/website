# 陈懂 · website

个人主页 + Markdown 博客。  
**改 `content/` → push `main` → GitHub Actions → Cloudflare Pages。**

| | |
|--|--|
| 展示名 | 陈懂（[@cuteLittleDevil](https://github.com/cuteLittleDevil)） |
| 目标域名 | [cute-little-devil.com](https://cute-little-devil.com)（`site.baseUrl`） |
| 免费预览 | Cloudflare 给的 `*.pages.dev`（控制台 Visit；可不买域名） |
| Pages 项目 | 默认 `website`（Variable `CLOUDFLARE_PROJECT_NAME` 可改） |

## 本地

```bash
npm install
make              # 构建 + http://localhost:4173
# 或: npm run build / npm run preview
```

## 改内容

| 做什么 | 改哪里 |
|--------|--------|
| 写博客 | `content/posts/yyyy-mm-dd-slug.md`（frontmatter 见 `docs/CONTENT-MODEL.md`） |
| 简介 / 项目 | `content/site.yaml` |
| 样式 | `DESIGN.md` → `src/styles/*` |

本地可 `npm run build` 检查，再 commit / push `main`。

## 部署（GitHub Actions → Pages）

1. Cloudflare 建 Pages 项目名 **`website`**（或与 Variable 一致）。无域名也可用 `*.pages.dev`。
2. API Token（[创建](https://dash.cloudflare.com/profile/api-tokens)）：**Custom** → 权限 **Account · Cloudflare Pages · Edit**（不要只用 Workers 模板）。
3. GitHub → **Settings → Secrets and variables → Actions**：

| Secret | 值 |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | 上一步 Token |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard 里的 Account ID |

4. push `main` 看 **Actions**。成功后在 Pages 项目 **Visit** 打开站点。

### 绑自定义域名

Pages 项目 → **Custom domains** → 添加 `cute-little-devil.com`（可再加 `www`）→ 等 **Active**。  
域名已在 Cloudflare 时 DNS/证书一般会自动处理。

当前流程：**Action + `wrangler pages deploy`**。不要再在 CF 控制台接 Git 自动部署，避免双重部署。

## 目录

```text
content/           # 日常只改这里
src/               # 样式 + 星空/太阳系等前端脚本
scripts/           # build.mjs
docs/              # 契约与 Agent 流程
design-previews/   # 本地风格对比（不进 dist / 不上线）
.github/           # deploy workflow
DESIGN.md          # 视觉
```

Agent 改站：先读 `docs/AGENT-WORKFLOW.md` / `CLAUDE.md`。

## License

站点内容归作者；脚手架可按 MIT 自用。
