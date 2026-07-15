# GitHub Pages 部署指南

使用 GitHub Pages 免费部署 Stellar 主题前端，支持自动构建和自定义域名。

::: warning 关键限制
GitHub Pages **仅托管静态文件**，不支持反向代理。API 必须使用 `static` 模式直连后端，且**后端必须配置 CORS 跨域**。此外，GitHub Pages 原生不支持 Vue Router History 模式，需要额外配置 404 回退方案。
:::

---

## 前提条件

- [GitHub](https://github.com) 账号
- Git 已安装并配置

---

## 方式一：GitHub Actions 自动构建部署（推荐）

### 1. 配置 API 地址

编辑 [`public/env.js`](public/env.js)，设置 API 连接方式：

```js
window.settings = {
  title: 'Stellar',
  api: {
    // GitHub Pages 无法反向代理，必须使用 static 模式直连后端
    url_mode: 'static',
    static_base_urls: ['https://api.example.com'], // 替换为你的 XBoard 后端地址
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

::: danger 必读：SPA 路由回退
GitHub Pages 默认只处理根路径，子页面（如 `/dashboard`）刷新会返回 404。必须使用 `404.html` 回退方案或 Hash 模式路由，否则部署后无法正常使用。
:::

### 2. 后端配置 CORS

在后端（XBoard）Nginx 配置中添加跨域头：

```nginx
add_header 'Access-Control-Allow-Origin' 'https://your-username.github.io' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```

### 3. 创建 GitHub Actions 工作流

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]  # 推送到 main 分支时自动部署

# 设置 GITHUB_TOKEN 的权限
permissions:
  contents: read
  pages: write
  id-token: write

# 并发控制
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4. 配置 GitHub Pages

操作步骤：

1. 在 GitHub 仓库页面点击 **Settings**
2. 左侧菜单选择 **Pages**
3. 在 **Source** 中选择 **GitHub Actions**
4. 工作流创建完成后推送到 `main` 分支，Actions 会自动构建并部署

### 5. 访问站点

::: tip 子路径注意
如果你的仓库名为 `your-repo`，访问地址为 `https://your-username.github.io/your-repo/`。需要在 [`vite.config.ts`](vite.config.ts) 中设置 `base: '/your-repo/'`，否则静态资源路径会错误。
:::

部署完成后访问：

```
https://your-username.github.io/your-repo/
```

---

## 方式二：手动构建上传

适合一次性部署或不希望使用 CI/CD 的场景。

### 1. 本地构建

```bash
# 安装依赖
npm ci

# 修改 public/env.js 配置 API 地址
# ...

# 构建生产包
npm run build
```

### 2. 配置 GitHub Pages 源

1. 在 GitHub 仓库 **Settings** → **Pages**
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选择 `gh-pages` 或 `main` + `/docs` 目录

### 3. 推送构建产物

#### 方法 A：使用 gh-pages 分支

```bash
# 安装 gh-pages 工具
npm install --save-dev gh-pages

# 在 package.json 中添加脚本
# "deploy": "gh-pages -d dist"

# 执行部署
npm run deploy
```

推荐在 [`package.json`](package.json) 中添加脚本：

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist -b gh-pages"
  }
}
```

#### 方法 B：使用 docs 目录

1. 将构建产物复制到仓库的 `docs/` 目录
2. 推送到仓库
3. 在 GitHub Pages 设置中选择 `main` 分支 + `/docs` 目录

### 4. 配置 SPA History 模式回退

GitHub Pages 原生不支持 Vue Router History 模式的自定义路由回退。

#### 方案一：使用 404 页面回退（推荐）

创建 [`public/404.html`](public/404.html)，内容与 `index.html` 完全一致：

```bash
# 在构建命令后复制 index.html 为 404.html
cp dist/index.html dist/404.html
```

修改 [`vite.config.ts`](vite.config.ts)，在构建时自动复制：

```ts
// vite.config.ts
import { copyFileSync } from 'fs'

export default defineConfig(({ mode }) => {
  return {
    // ... 其他配置
    plugins: [
      vue(),
      // ... 其他插件
      {
        name: 'copy-404',
        apply: 'build',
        closeBundle() {
          copyFileSync('dist/index.html', 'dist/404.html')
        }
      }
    ],
  }
})
```

#### 方案二：使用 Hash 模式路由（备选）

如果 404 方案不可行，可以改用 Hash 模式路由。修改 [`src/router/index.ts`](src/router/index.ts)：

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), // 使用 Hash 模式
  routes: [
    // ... 路由表
  ]
})
```

> Hash 模式 URL 会带有 `#` 符号，例如 `https://your-username.github.io/#/dashboard`

### 5. 配置自定义域名

1. 在仓库 **Settings** → **Pages** → **Custom domain**
2. 输入你的域名，例如 `panel.example.com`
3. GitHub 会自动创建 `CNAME` 文件到仓库
4. 在你的域名 DNS 管理中添加 CNAME 记录指向 `your-username.github.io`

---

## 环境变量

在 GitHub Actions 中可以通过 Secrets 管理敏感信息：

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 添加环境变量

然后在工作流中使用：

```yaml
- name: Build
  env:
    VITE_CDN_URL: ${{ secrets.CDN_URL }}
  run: npm run build
```

---

## API 连接方案

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **CORS 直连**（推荐） | `url_mode: 'static'`，直连后端 API | 后端有独立域名 |
| **Cloudflare Proxy** | 通过 Cloudflare 代理转发 API 请求 | 域名使用 Cloudflare DNS |
| **第三方 API 网关** | 使用 API 网关统一转发 | 需要流量控制和安全防护 |

---

## 常见问题

### 页面刷新 404

::: danger 常见陷阱
这是 GitHub Pages 部署最常见的问题。**即使 API 都正常工作，刷新页面也会 404**。务必配置 404.html 回退或使用 Hash 路由。
:::

**原因**：GitHub Pages 默认行为，除根路径外其他路径会返回 404。

**解决**：创建 `404.html` 内容与 `index.html` 一致（参见上方配置），或使用 Hash 模式路由。

### 部署后内容未更新

**原因**：GitHub Pages 有缓存。

**解决**：清除浏览器缓存（`Ctrl+F5`）或等待几分钟重新访问。

### API 请求跨域

**原因**：浏览器安全策略阻止跨域请求。

**解决**：后端配置 CORS 头，允许 GitHub Pages 域名访问。

### 构建产物路径问题

::: details 路径配置详解
部署在子路径时，`base`、`routerBase` 和 `assets_path` 三个路径必须一致。举例：部署在 `https://user.github.io/stellar/`，则 `base: '/stellar/'`、`routerBase: '/stellar/'`、`assets_path: '/stellar/assets'`。
:::

**原因**：资源引用路径不正确。

**解决**：如果部署到 `https://user.github.io/repo/`，需在 [`vite.config.ts`](vite.config.ts) 中设置 `base`：

```ts
export default defineConfig({
  base: '/repo/', // 替换为你的仓库名
  // ...
})
```

---

## 快速参考

```bash
# 1. 初始化
git init
git add .
git commit -m "init"

# 2. 推送代码
git remote add origin https://github.com/your-username/stellar.git
git push -u origin main

# 3. 在 GitHub 仓库 Settings → Pages 中启用 GitHub Pages
# 4. 配置 CORS 和 API 地址
# 5. 自动部署完成 ✅
```

---

## 相关链接

- [GitHub Pages 官方文档](https://docs.github.com/pages)
- [GitHub Actions 工作流语法](https://docs.github.com/actions/using-workflows)
- [Stellar 运行时配置](public/env.js)
- [Stellar Vite 配置](vite.config.ts)
