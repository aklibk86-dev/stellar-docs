# Vercel 部署指南

使用 Vercel 部署 Stellar 主题前端，支持自动构建、HTTPS、自定义域名和边缘网络加速。

::: warning 关键限制
Vercel 是无服务器环境，**不支持反向代理**。API 必须使用 `static` 模式直连后端，且后端需配置 CORS 跨域。这是部署前必须理解的前提。
:::

---

## 前提条件

- [Vercel](https://vercel.com) 账号（可使用 GitHub/GitLab 账号登录）
- 代码托管在 GitHub / GitLab / Bitbucket

---

## 方式一：Git 导入部署（推荐）

### 1. 配置 API 地址

编辑 [`public/env.js`](public/env.js)，设置 API 连接方式：

```js
window.settings = {
  title: 'Stellar',
  api: {
    // Cloudflare Pages 无法反向代理，必须使用 static 模式
    url_mode: 'static',
    static_base_urls: ['https://api.example.com'], // 替换为你的 XBoard 后端地址
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

::: danger 重要：CORS 必须配置
Vercel 部署的前端与后端处于不同域名，浏览器会阻止跨域请求。**后端必须配置 `Access-Control-Allow-Origin` 响应头**，否则所有 API 请求都会失败。请参考下方后端配置示例。
:::

### 2. 后端配置 CORS（重要）

在后端（XBoard 或其他后端）配置跨域头，允许前端域名访问：

```nginx
# 后端 Nginx 配置示例
add_header 'Access-Control-Allow-Origin' 'https://your-project.vercel.app' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```

### 3. 创建 Vercel 项目

操作步骤：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** → **Project**
3. 选择你的 Git 仓库（GitHub / GitLab / Bitbucket）
4. Vercel 会自动检测项目配置

### 4. 配置构建参数

Vercel 会自动识别以下配置：

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | `Vite`（自动检测） |
| **Build Command** | `npm run build`（自动从 `package.json` 读取） |
| **Output Directory** | `dist`（自动从 `vite.config.ts` 读取） |
| **Install Command** | `npm ci` |

无需手动修改，保持默认即可。

### 5. 环境变量（可选）

如需自定义构建行为，可在 Vercel 项目设置中添加环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_CDN_URL` | 静态资源 CDN 前缀 | `https://cdn.example.com/stellar/` |

### 6. 部署

点击 **Deploy**，Vercel 会自动执行构建并部署。部署完成后会生成预览 URL：

```
https://your-project.vercel.app
```

### 7. 配置自定义域名

1. 进入项目 **Settings** → **Domains**
2. 输入你的域名，例如 `panel.example.com`
3. 按 Vercel 提示配置 DNS（CNAME 记录指向 `cname.vercel-dns.com`）
4. Vercel 会自动申请和续签 SSL 证书

---

## 方式二：Vercel CLI 部署

::: tip 适用场景
适合 CI/CD 流水线、自动化部署，或不想将代码托管到 Vercel Git 仓库的场景。
:::

适合 CI/CD 流水线或不想将代码托管到 Vercel Git 的场景。

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录

```bash
vercel login
```

### 3. 部署

```bash
# 在项目根目录执行
vercel --prod

# 或指定输出目录
vercel --prod --cwd dist
```

### 4. 配置文件

[`vercel.json`](vercel.json) 已包含必要配置：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

::: info 路由回退说明
[`vercel.json`](vercel.json) 中的 Rewrites 规则将**所有路由**（`/(.*)`）回退到 `index.html`，这是 Vue Router History 模式在 Vercel 上正常工作的关键配置。
:::

此配置确保 Vue Router History 模式正常工作，所有路由回退到 `index.html`。

---

## 环境变量管理

Vercel 支持在不同环境中使用不同的变量值：

```
Production:   https://panel.example.com
Preview:      https://pr-1.your-project.vercel.app
Development:  https://your-project.vercel.app
```

推荐将 API 地址等配置放在 [`public/env.js`](public/env.js) 中统一管理，而非使用构建环境变量，这样无需重新构建即可修改配置。

---

## API 连接方案

::: details 为什么 Vercel 不能反向代理？
Vercel 托管的是静态文件，没有运行 Nginx 等 Web 服务器。虽然可以通过 `vercel.json` 的 Rewrites 将 `/api/` 请求转发到后端，但这实际上是 Vercel 边缘网络层面的代理，并非传统反向代理，且在无服务器环境中功能有限。
:::

由于 Vercel 无服务器环境限制，API 连接有以下方案：

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **CORS 直连**（推荐） | `url_mode: 'static'`，前端直接调用后端 API，后端配置 CORS | 后端有独立域名 |
| **Vercel Serverless Proxy** | 使用 Vercel 的 `vercel.json` 配置 Rewrites 代理 | 后端在同域名下 |
| **第三方代理** | 使用 Cloudflare、Nginx 等中间层代理 | 需要代理转发 |

### Vercel Rewrites 代理示例

如果后端与 Vercel 部署在同个域名下（通过 DNS 解析），可配置 Rewrites：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.example.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

对应的 [`env.js`](public/env.js) 配置：

```js
api: {
  url_mode: 'auto',
  auto: {
    append_path: '/api'
  }
}
```

---

## 预览部署与自动发布

Vercel 为每个 Pull Request 自动生成预览部署：

1. 提交 PR 到 Git 仓库
2. Vercel 自动构建并生成预览 URL
3. 团队成员可直接点击预览链接查看效果
4. 合并 PR 到主分支后自动发布到生产环境

---

## 自定义构建命令

如需自定义构建过程，在 Vercel 项目设置中修改：

```bash
# Build Command
npm run build

# Output Directory
dist
```

或通过 [`vercel.json`](vercel.json) 配置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci"
}
```

---

## 常见问题

### 页面刷新 404

::: danger 常见错误
Vercel 部署后刷新页面 404 是最常见的问题。确保 [`vercel.json`](vercel.json) 文件存在于项目根目录，且 Rewrites 规则正确配置。此外，也可以在 Vercel 项目设置中的 **Output Directory** 确认构建输出为 `dist`。
:::

**原因**：Vue Router History 模式未配置回退。

**解决**：[`vercel.json`](vercel.json) 已包含正确的 Rewrites 规则。如果还出现问题，检查文件是否被正确包含在部署中。

### API 请求跨域报错

**原因**：前端域名与后端域名不同。

**解决**：
1. 使用 `url_mode: 'static'` 并配置 CORS
2. 或使用 Vercel Rewrites 代理方案

### 构建失败

**原因**：Node.js 版本不兼容或依赖安装失败。

**解决**：
1. 在 Vercel 项目设置中指定 Node.js 版本（Settings → General → Node.js Version）
2. 推荐使用 `20.x`

### Logo 图片不显示

**原因**：图片路径配置错误。

**解决**：将 Logo 图片放在 `public/` 目录，[`env.js`](public/env.js) 中配置相对路径：

```js
logo: '/logo.png',
```

---

## 项目演示

```bash
# 1. 准备仓库
git init
git add .
git commit -m "init"

# 2. 推送到 GitHub
git remote add origin https://github.com/your-username/stellar.git
git push -u origin main

# 3. 在 Vercel 导入该仓库
# 4. 配置 env.js 中 API 地址
# 5. 部署完成 ✅
```

---

## 相关链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel.json 配置参考](https://vercel.com/docs/project-configuration)
- [Stellar 运行时配置](public/env.js)
- [Stellar Nginx 配置模板](nginx.conf.example)
