# 陈懂 · website

个人主页 + Markdown 技术博客（信息架构参考 [stormzhang.ai](https://stormzhang.ai/)）。  
**写笔记 → push GitHub → Actions 构建 → Cloudflare Pages 上线。**

- 生产域名：**[cute-little-devil.com](https://cute-little-devil.com)**（配置值 `https://cute-little-devil.com`）
- Cloudflare Pages 项目名：**website**
- 展示名：**陈懂**（GitHub：[@cuteLittleDevil](https://github.com/cuteLittleDevil)）
- 正式视觉：**Linear 深色裁剪风**（见 `DESIGN.md`）
- 风格对比预览：`design-previews/index.html`（构建后也会进 `dist/design-previews/`）
- 约束文档：`docs/SDD.md` · `CONTENT-MODEL.md` · `PAGE-CONTRACTS.md` · `AGENT-WORKFLOW.md`

## 本地开发

```bash
npm install
npm run build          # 输出 dist/
npm run preview        # 构建并在 http://localhost:4173 预览
```

## 发博客

1. 新增 `content/posts/yyyy-mm-dd-slug.md`（frontmatter 见 `docs/CONTENT-MODEL.md`）
2. 本地可先 `npm run build` 检查
3. `git add` → `commit` → `push` 到 `main`
4. GitHub Action 自动部署到 Cloudflare

改简介 / 项目列表：编辑 `content/site.yaml`。

## Cloudflare + GitHub Actions

1. Pages 项目名默认 **`website-bo4`**（可用 Variable `CLOUDFLARE_PROJECT_NAME` 覆盖）。  
   生产预览：`https://website-bo4.pages.dev`；单次部署形如 `https://<hash>.website-bo4.pages.dev`。
2. **创建 API Token（最易踩坑）** — 官方要求 **Account → Cloudflare Pages → Edit**：
   - 打开 [API Tokens](https://dash.cloudflare.com/profile/api-tokens)（或 Account API Tokens）
   - **Create Token → Custom token → Get started**
   - Permissions 只加这一条即可部署：
     | 第一列 | 第二列 | 第三列 |
     |--------|--------|--------|
     | **Account** | **Cloudflare Pages** | **Edit** |
   - （可选）再加 **User → User Details → Read**，消除 wrangler 取邮箱警告
   - **Account Resources**：Include → **你的那个 Account**（不要选错号）
   - Create Token 后**整段复制**（只显示一次）
   - ⚠️ **不要**只用 “Edit Cloudflare Workers” 模板——经常**没有** Pages 权限，会报 `Authentication error [code: 10000]`
3. 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | 上一步 Token（前后无空格/换行） |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID：Dashboard URL 里 `dash.cloudflare.com/<这一段>/` 或 Overview → API |

可选 **Variable**：`CLOUDFLARE_PROJECT_NAME`（默认 `website`）

4. 推送 `main` 或 Actions → **Re-run**。Workflow 会先 **Verify Cloudflare API credentials**：成功应看到 `api.success = True` 与项目列表；若仍 10000，按日志重做 Token。

### 自定义域名 cute-little-devil.com

1. 域名已在 Cloudflare 注册/托管：**cute-little-devil.com**
2. Cloudflare Dashboard → Pages 项目 `website` → **Custom domains** → 添加 `cute-little-devil.com`（建议同时加 `www` 并做跳转）
3. 域名已在 Cloudflare DNS 时按提示自动加记录即可；证书由 Cloudflare 自动签发
4. `content/site.yaml` 里 `site.baseUrl` 为 `https://cute-little-devil.com`（用于 canonical / sitemap）

也可在 Cloudflare 控制台直接绑定本 GitHub 仓库；若使用控制台 Git 集成，注意不要与 Action 双重部署冲突（二选一即可）。当前仓库默认采用 **Action + `wrangler pages deploy`**。

## 目录结构

```text
content/           # 人设 + 博客（日常只改这里）
design-previews/   # 多风格 HTML 对比
docs/              # SDD / 契约 / Agent 流程
scripts/build.mjs  # 静态构建
src/styles/        # tokens + site CSS
templates/         # （逻辑在 build.mjs 内联模板，保持单文件可维护）
DESIGN.md          # 视觉系统
dist/              # 构建产物（gitignore）
```

## Agent 改站

先读 `docs/AGENT-WORKFLOW.md`。原则：

| 意图 | 改哪里 |
|------|--------|
| 发文 | `content/posts/*` |
| 人设项目 | `content/site.yaml` |
| 样式 | `DESIGN.md` → `src/styles/*` |
| 页面结构 | 先改 `docs/PAGE-CONTRACTS.md` |

## License

个人站点内容归作者所有；构建脚手架可按 MIT 自用。
