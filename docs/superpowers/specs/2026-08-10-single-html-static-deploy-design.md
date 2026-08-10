# 单文件 HTML 静态部署约定

## 背景

项目根目录已有 `single-page-test/` 存放一批独立的单文件 HTML（自包含调试/演示页面），但这些文件目前不随 Next.js 项目一起部署，无法通过线上 URL 直接访问。

需要一种方式：把某个自包含的单文件 HTML 跟随现有 Next.js 应用一起部署到 Cloudflare Pages，通过 URL 直接访问。

## 部署现状

- Next.js 项目（`code/`）通过 GitHub 仓库与 Cloudflare Pages 绑定，push 代码即自动触发构建部署。
- `wrangler.toml` 主要用于本地 `wrangler dev` 联调 D1 数据库，不是部署入口。

## 方案

直接复用 Next.js 原生的 `public/` 静态资源机制：`code/public/` 下的文件会被原样复制到构建产物根目录，Cloudflare Pages 把它们当静态文件直接 serve，不经过 Next.js 路由或服务端逻辑。

**不需要新增任何脚本、prebuild 步骤或 CI 配置** —— 这是 Next.js + Cloudflare Pages 已有能力的直接复用。

### 约定

- 目录：`code/public/single-html-deploy/`
- 用法：把自包含的单文件 HTML 直接放进该目录，例如 `code/public/single-html-deploy/demo.html`
- 部署：`git push` 后 Cloudflare Pages 自动构建部署
- 访问路径：`https://<域名>/single-html-deploy/demo.html`

### 已确认的兼容性

`code/app/` 目录下没有会与 `/single-html-deploy/*` 路径冲突的动态路由（如 `[...slug]` catch-all），因此不会被 Next.js 路由抢先拦截。

### 约束

HTML 文件必须自包含（内联 CSS/JS，或引用完整 URL 的外部资源），因为 `public/` 目录下的文件不会经过 webpack/PostCSS 等构建处理，是原样透传的。

## 为什么这么改

- 用户已有的部署链路（GitHub → Cloudflare Pages 自动构建）本身就会把 `public/` 内容一并发布，不需要额外的部署项目或拷贝脚本。
- 曾考虑过的其他方案（项目根目录单独维护源文件夹 + prebuild 拷贝、或另建独立 Cloudflare Pages 项目）都会引入额外的维护成本，用户明确选择了最简单、零改动的方案。
