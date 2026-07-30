---
title: 你好，这是我的静态博客流水线
date: 2026-07-30
slug: hello-site
summary: 用 Markdown + GitHub Actions + Cloudflare Pages 搭一条「写笔记即发布」的个人站流水线。
tags: [meta, workflow]
---

## 为什么要自己搭

市面上博客平台很多，但我更希望：

1. **笔记就是仓库里的 Markdown**，和代码一样可 diff、可 PR。
2. **推送到 GitHub 后自动上线**，不必再登录别的后台点发布。
3. **页面约束固定**，以后交给 Agent 改 UI 也不会每次换一种审美。

## 这条链路怎么走

```text
content/posts/*.md
        │
        ▼
  npm run build   （本地或 CI）
        │
        ▼
     dist/**
        │
        ▼
 Cloudflare Pages  ←  GitHub Actions
```

日常我只需要：

1. 新增或修改 `content/posts/yyyy-mm-dd-slug.md`
2. `git commit` + `git push`
3. 等 Action 变绿

## 和本站约束文档的关系

- 长相：`DESIGN.md`
- 信息架构：`docs/PAGE-CONTRACTS.md`
- 字段约定：`docs/CONTENT-MODEL.md`
- Agent 改站流程：`docs/AGENT-WORKFLOW.md`

把「写什么」和「长什么样」拆开，长期维护成本会低很多。

## 接下来

- 把协议对接、压测和踩坑写成系列笔记
- 需要时再加 RSS、标签页等能力

如果你也在做 JT 或流媒体相关的事，欢迎来 [GitHub](https://github.com/cuteLittleDevil) 交流。
