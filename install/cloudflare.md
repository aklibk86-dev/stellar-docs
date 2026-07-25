# Cloudflare Pages 一键部署 Stellar

使用 Cloudflare Pages 免费托管 Stellar 前端，全球边缘网络加速，自动 HTTPS，适合新手操作。

::: warning 重要限制
Cloudflare Pages **仅托管静态文件**，不支持反向代理。API 必须使用 `static` 模式直连后端，且后端需要配置跨域（CORS）。
:::

---

## 你需要准备什么

- ✅ [Cloudflare](https://dash.cloudflare.com) 账号
- ✅ 代码托管在 GitHub / GitLab
- ✅ XBoard 后端服务已安装并正常运行

---

## 第一步：配置 API 地址

**这一步做什么**：告诉 Stellar 后端 API 的地址。

编辑 `public/env.js` 文件：

```js
window.settings = {
  title: 'Stellar',                    // ← 改成你的网站名称
  api: {
    // Cloudflare Pages 无法反向代理，必须用 static 模式
    url_mode: 'static',
    static_base_urls: ['https://api.example.com'],  // ← 改这里！改成你的后端地址
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

::: danger 必须配置 CORS！
Cloudflare Pages 部署的前端和后端在不同域名下，浏览器会阻止跨域请求。**后端必须配置跨域头**，否则登录、注册都会失败。

在后端 Nginx 中添加以下配置：

```nginx
# 允许前端域名访问（改成你的 Pages 域名）
add_header 'Access-Control-Allow-Origin' 'https://your-project.pages.dev' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```
:::

---

## 第二步：创建 Cloudflare Pages 项目

**这一步做什么**：把你的代码仓库连接到 Cloudflare。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧 **Workers & Pages** → **Pages**
3. 点击 **Connect to Git**
4. 授权 GitHub / GitLab 账号
5. 选择你的 Stellar 主题仓库

---

## 第三步：配置构建参数

**这一步做什么**：告诉 Cloudflare 怎么构建项目。

配置以下参数：

| 配置项 | 值 |
|--------|-----|
| **Framework preset** | `Vite`（在框架下拉菜单中选择） |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### 重要：添加环境变量

Cloudflare 默认 Node.js 版本较低，**必须**指定版本：

1. 点击 **Environment variables (advanced)**
2. 点击 **Add variable**
3. 添加变量：

| 变量名 | 值 |
|--------|-----|
| `NODE_VERSION` | `20` |

---

## 第四步：部署完成

**这一步做什么**：等待构建完成，获取访问地址。

点击 **Save and Deploy**，部署完成后会生成预览 URL：

```
https://your-project.pages.dev
```

---

## 第五步：配置自定义域名（可选）

**这一步做什么**：用你自己的域名访问网站。

1. 进入项目 **Settings** → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名，比如 `panel.example.com`
4. Cloudflare 会自动添加 DNS 记录并申请 SSL 证书

---

## 验证部署

打开浏览器访问你的域名：

- 如果能看到 Stellar 的落地页，说明部署成功
- 尝试注册、登录，验证 API 通信是否正常

---

## 常见问题

### 1. 页面刷新后出现 404

**原因**：Vue Router History 模式没有配置回退规则。

**解决方法**：
- 确保项目 `public/` 目录有 `_redirects` 文件
- 文件内容应为：
  ```
  /* /index.html 200
  ```

### 2. 构建报错 Node.js 版本不支持

**原因**：Cloudflare 默认 Node.js 版本太低。

**解决方法**：
- 在项目设置中添加环境变量 `NODE_VERSION = 20`
- 路径：Settings → Environment variables → Add variable

### 3. API 请求跨域报错

**原因**：前端域名和后端域名不同。

**解决方法**：
- 在后端配置 CORS 跨域头（参考第一步的 Nginx 配置）
- 或使用 Cloudflare Functions 代理（见下方高级选项）

---

## 高级选项

### CLI 或直接上传部署

如果你不想用 Git 集成，可以使用 Wrangler CLI 或直接上传。

::: details 点击展开 CLI/上传部署教程

#### 使用 Wrangler CLI

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

#### 使用 Dashboard 直接上传

1. 进入 **Workers & Pages** → **Pages** → **Create a project** → **Upload Directory**
2. 输入项目名称
3. 将本地构建产物 `dist/` 目录拖拽到上传区域
4. 点击 **Deploy**

:::

### Cloudflare Functions 代理

如果你不想配置 CORS，可以使用 Cloudflare Functions 实现 API 代理。

::: details 点击展开 Functions 配置

#### 第一步：创建代理文件

在项目根目录创建 `functions/api/[[path]].ts`：

```ts
export async function onRequest(context: EventContext) {
  const { request, env } = context
  
  // 目标后端地址（通过环境变量配置）
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
  
  // 添加 CORS 头
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  
  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
```

#### 第二步：添加环境变量

| 变量名 | 值 |
|--------|-----|
| `API_TARGET` | `https://api.example.com`（你的后端地址） |
| `NODE_VERSION` | `20` |

#### 第三步：修改 env.js

```js
api: {
  url_mode: 'auto',
  auto: {
    append_path: '/api',
  }
}
```

> 注意：Cloudflare Functions 免费计划每天有 10 万次请求额度，超出后需升级付费计划。

:::
