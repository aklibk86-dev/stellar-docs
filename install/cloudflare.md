# Cloudflare Pages 部署指南

使用 Cloudflare Pages 免费部署 Stellar 主题前端，Cloudflare 全球边缘网络加速，自动 HTTPS 和自定义域名。

::: warning 关键限制
Cloudflare Pages **仅托管静态文件**，不支持反向代理。API 必须使用 `static` 模式直连后端，后端需配置 CORS 跨域。但是，Cloudflare 支持通过 **Functions（Serverless）** 实现 API 代理，可以解决跨域问题。
:::

---

## 前提条件

- [Cloudflare](https://dash.cloudflare.com) 账号
- 代码托管在 GitHub / GitLab

---

## 方式一：Git 连接部署（推荐）

### 1. 配置 API 地址

编辑 [`public/env.js`](public/env.js)，设置 API 连接方式：

```js
window.settings = {
  title: 'Stellar',
  api: {
    // Cloudflare Pages 无法反向代理，必须使用 static 模式直连
    url_mode: 'static',
    static_base_urls: ['https://api.example.com'], // 替换为你的 XBoard 后端地址
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

::: danger 重要：Node.js 版本
Cloudflare Pages 默认 Node.js 版本较低，**必须**通过环境变量 `NODE_VERSION = 20` 指定版本，否则构建会失败。详见下方构建设置。
:::

### 2. 后端配置 CORS

在后端 Nginx 中添加跨域头：

```nginx
# 允许 Cloudflare Pages 域名访问
add_header 'Access-Control-Allow-Origin' 'https://your-project.pages.dev' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```

### 3. 创建 Cloudflare Pages 项目

操作步骤：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Pages**
3. 点击 **Connect to Git**
4. 授权 GitHub / GitLab 账号
5. 选择你的 Stellar 主题仓库

### 4. 配置构建设置

| 配置项 | 值 |
|--------|-----|
| **Project name** | `stellar`（自动生成） |
| **Production branch** | `main` |
| **Framework preset** | `Vite`（在框架下拉菜单中选择） |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | 留空（项目根目录） |
| **Node.js version** | `20`（在 Environment variables 中设置） |

**添加环境变量**：点击 **Environment variables (advanced)** → **Add variable**

| 变量名 | 值 |
|--------|-----|
| `NODE_VERSION` | `20` |

::: tip 环境变量生效范围
`NODE_VERSION` 环境变量在构建时生效。如需在不同分支使用不同的 Node.js 版本，可以在 **Preview** 和 **Production** 环境中分别设置。
:::

### 5. 部署

点击 **Save and Deploy**，Cloudflare 会自动构建并部署。首次部署后生成：

```
https://your-project.pages.dev
```

### 6. SPA History 模式配置

[`public/_redirects`](public/_redirects) 已包含 SPA 回退规则：

```
/* /index.html 200
```

Cloudflare Pages 会自动读取此文件，确保 Vue Router History 模式正常工作。

::: info SPA 回退原理
[`public/_redirects`](public/_redirects) 文件中的 `/* /index.html 200` 规则告诉 Cloudflare 边缘节点：所有路径都返回 `index.html` 内容且状态码为 200。这模拟了 Nginx 的 `try_files` 行为，确保 Vue Router History 模式正常工作。
:::

### 7. 配置自定义域名

1. 进入项目 **Settings** → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名，例如 `panel.example.com`
4. Cloudflare 会自动添加 DNS 记录并申请 SSL 证书

---

## 方式二：CLI 或直接上传部署

适合不使用 Git 集成的场景。

### 使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install --save-dev wrangler

# 登录 Cloudflare
npx wrangler login

# 本地构建
npm run build

# 部署
npx wrangler pages deploy dist --project-name stellar
```

### 使用 Dashboard 直接上传

1. 进入 **Workers & Pages** → **Pages** → **Create a project** → **Upload Directory**
2. 输入项目名称
3. 将本地构建产物 `dist/` 目录拖拽到上传区域
4. 点击 **Deploy**

> 直接上传方式每次需手动操作，推荐使用 Git 集成实现自动部署。

---

## 方式三：API 代理（Cloudflare Functions）

Cloudflare Pages 支持 Functions（Serverless），可以实现 API 转发，解决跨域问题。

### 1. 创建 Functions 目录

在项目根目录创建 `functions/api/[[path]].ts`：

```ts
// functions/api/[[path]].ts
export async function onRequest(context: EventContext) {
  const { request, env } = context

  // 目标后端地址
  const targetHost = env.API_TARGET || 'https://api.example.com'

  // 构建目标 URL
  const url = new URL(request.url)
  const targetUrl = `${targetHost}${url.pathname}${url.search}`

  // 转发请求
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined,
  })

  // 添加 CORS 头（允许前端域名访问）
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
```

### 2. 配置 env.js

```js
api: {
  url_mode: 'auto',
  auto: {
    append_path: '/api',
  },
}
```

### 3. 设置环境变量

在 Cloudflare Pages 项目中添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `API_TARGET` | `https://api.example.com`（后端真实地址） |
| `NODE_VERSION` | `20` |

### 4. 部署

推送到 Git 仓库，Cloudflare Pages 自动构建时会包含 Functions。

::: warning Functions 免费额度
Cloudflare Functions 免费计划每天有 10 万次请求额度，超出后需升级付费计划。如果你的站点用户量大，建议仍使用 CORS 直连方案。
:::

---

## 分支预览（Preview Deployments）

Cloudflare Pages 自动为每个分支和 Pull Request 生成预览部署：

1. 创建新分支或提交 PR
2. Cloudflare 自动构建并部署到预览 URL
3. 预览 URL 格式：`分支名.your-project.pages.dev`
4. 合并到主分支后自动发布到生产环境

---

## 环境变量管理

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NODE_VERSION` | Node.js 版本，设为 `20` | ✅ |
| `API_TARGET` | Functions 代理的目标 API 地址 | 使用 Functions 时必填 |

在项目 **Settings** → **Environment variables** 中管理：

- **Production**：生产环境变量
- **Preview**：预览环境变量
- **Branch**：可绑定到特定分支

---

## API 连接方案对比

| 方案 | 配置 | 优点 | 缺点 |
|------|------|------|------|
| **CORS 直连**（推荐） | `static` 模式 + 后端 CORS | 简单可靠 | 后端需配置跨域 |
| **Cloudflare Functions** | Functions 代理 + `auto` 模式 | 无跨域问题 | 有免费额度限制 |
| **API 网关** | 第三方 API 网关 | 功能丰富 | 维护成本高 |

---

## 常用配置

### 自定义 404 页面

[`public/404.html`](public/404.html) — 创建此文件可自定义 404 页面。建议复制 `index.html` 内容以支持 SPA 路由回退。

### 添加安全头

在 `_headers` 文件中配置：

```
# public/_headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 缓存策略

```ini
# public/_headers
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/env.js
  Cache-Control: no-store, no-cache, must-revalidate

/index.html
  Cache-Control: no-store, no-cache, must-revalidate
```

---

## 常见问题

### 页面刷新 404/白屏

::: danger 常见错误
Cloudflare Pages 的 SPA 回退依赖 [`public/_redirects`](public/_redirects) 文件。如果刷新页面出现 404 或白屏，首先检查构建产物 `dist/` 目录中是否包含此文件。
:::

**原因**：Vue Router History 模式未正确配置 SPA 回退。

**解决**：确保 [`public/_redirects`](public/_redirects) 文件内容正确：

```
/* /index.html 200
```

### 构建报错 Node.js 版本不支持

**原因**：Cloudflare Pages 默认 Node.js 版本过低。

**解决**：添加环境变量 `NODE_VERSION = 20`。

### API 请求跨域

**原因**：前端域名与后端域名不同。

**解决**：
1. 后端配置 CORS 头
2. 或使用 Cloudflare Functions 代理 API

### _redirects 文件不生效

**原因**：文件未在构建产物中或内容格式错误。

**解决**：
1. 检查 `_redirects` 是否在 `public/` 目录
2. 确认文件在构建后出现在 `dist/` 目录
3. 文件内容必须以换行符结尾

### Cloudflare 缓存导致配置未更新

**原因**：Cloudflare 边缘节点缓存了旧内容。

**解决**：
1. 在 Cloudflare Dashboard 中 **Purge Cache**（清除缓存）
2. 或在 [`env.js`](public/env.js) 中添加版本号参数

---

## 快速部署参考

```bash
# 1. 在 Cloudflare Dashboard 创建 Pages 项目
# 2. 连接 Git 仓库
# 3. 配置构建设置（选择 Vite 框架）
# 4. 添加环境变量 NODE_VERSION = 20
# 5. 部署完成 ✅

# 或使用 Wrangler CLI
npm ci
npm run build
npx wrangler pages deploy dist --project-name stellar
```

---

## 相关链接

- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions 文档](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Stellar 运行时配置](public/env.js)
- [Vite 配置](vite.config.ts)
