# Vercel 一键部署 Stellar

使用 Vercel 免费托管 Stellar 前端，自动构建、HTTPS、全球加速，适合新手操作。

::: warning 重要限制
Vercel 是无服务器环境，**不支持反向代理**。API 必须使用 `static` 模式直连后端，且后端需要配置跨域（CORS）。
:::

---

## 你需要准备什么

- ✅ [Vercel](https://vercel.com) 账号（可用 GitHub 账号登录）
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
    // Vercel 无法反向代理，必须用 static 模式
    url_mode: 'static',
    static_base_urls: ['https://api.example.com'],  // ← 改这里！改成你的后端地址
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

::: danger 必须配置 CORS！
Vercel 部署的前端和后端在不同域名下，浏览器会阻止跨域请求。**后端必须配置跨域头**，否则登录、注册都会失败。

在后端 Nginx 中添加以下配置：

```nginx
# 允许前端域名访问（改成你的 Vercel 域名）
add_header 'Access-Control-Allow-Origin' 'https://your-project.vercel.app' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```
:::

---

## 第二步：创建 Vercel 项目

**这一步做什么**：把你的代码仓库连接到 Vercel。

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** → **Project**
3. 选择你的 Git 仓库（GitHub / GitLab）
4. Vercel 会自动检测项目配置

---

## 第三步：配置构建参数

**这一步做什么**：告诉 Vercel 怎么构建项目。

Vercel 会自动识别以下配置，无需手动修改：

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | `Vite`（自动检测） |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

直接点击 **Deploy** 即可。

---

## 第四步：部署完成

**这一步做什么**：等待构建完成，获取访问地址。

部署完成后会生成预览 URL：

```
https://your-project.vercel.app
```

---

## 第五步：配置自定义域名（可选）

**这一步做什么**：用你自己的域名访问网站。

1. 进入项目 **Settings** → **Domains**
2. 输入你的域名，比如 `panel.example.com`
3. 按 Vercel 提示配置 DNS（添加 CNAME 记录指向 `cname.vercel-dns.com`）
4. Vercel 会自动申请和续签 SSL 证书

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
- 确保项目根目录有 `vercel.json` 文件
- 文件内容应为：
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### 2. API 请求跨域报错

**原因**：前端域名和后端域名不同。

**解决方法**：
- 在后端配置 CORS 跨域头（参考第一步的 Nginx 配置）
- 或使用 Vercel Rewrites 代理（见下方高级选项）

### 3. 构建失败

**原因**：Node.js 版本不兼容。

**解决方法**：
- 在 Vercel 项目设置中指定 Node.js 版本
- 路径：Settings → General → Node.js Version → 选择 `20.x`

---

## 高级选项

### CLI 部署

如果你不想用 Git 集成，可以使用 Vercel CLI 部署。

::: details 点击展开 CLI 部署教程

#### 第一步：安装 CLI

```bash
npm install -g vercel
```

#### 第二步：登录

```bash
vercel login
```

#### 第三步：部署

```bash
# 在项目根目录执行
vercel --prod
```

:::

### Vercel Rewrites 代理

如果你想避免跨域问题，可以使用 Vercel 的 Rewrites 功能代理 API 请求。

::: details 点击展开 Rewrites 配置

#### 第一步：修改 vercel.json

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.example.com/api/$1" },  // ← 改这里！
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 第二步：修改 env.js

```js
api: {
  url_mode: 'auto',
  auto: {
    append_path: '/api',
  }
}
```

这样前端请求 `/api/xxx` 会被 Vercel 自动转发到后端。

:::
