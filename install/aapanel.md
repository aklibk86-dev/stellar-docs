# Stellar Theme — aaPanel 部署教程

使用 aaPanel（宝塔国际版）部署 Stellar 主题到服务器，支持根目录和子目录两种方式。

::: tip 适用对象
本教程适用于已有 aaPanel（宝塔国际版）面板的用户。如果你使用的是宝塔国内版，操作方法基本相同。
:::

## 目录

- [前置准备](#前置准备)
- [方式一：根目录部署（推荐）](#方式一根目录部署推荐)
- [方式二：子目录部署](#方式二子目录部署)
- [配置 API 接入](#配置-api-接入)
- [常见问题](#常见问题)

---

## 前置准备

1. **一台 Linux 服务器**（CentOS 7+ / Ubuntu 20.04+ / Debian 11+），已安装 aaPanel。
2. **aaPanel 已安装 Nginx**（网站服务）和 **Node.js**（构建项目）。
   - 在 aaPanel 应用商店搜索 "Node.js" 安装，版本建议 20 LTS 或更高。
3. **项目源码**，可通过 Git 拉取或手动上传：
   ```bash
   git clone https://github.com/aklibk86-dev/stellar.git
   ```
4. **一个已解析到服务器的域名**（如 `example.com`）。

---

## 方式一：根目录部署（推荐）

前后端同域，通过 Nginx 反向代理 `/api/` 到 XBoard 后端，无需处理跨域。

### 第一步：构建项目

在本地或服务器上构建生产版本：

```bash
# 进入项目目录
cd stellar

# 安装依赖
npm ci

# 构建生产版本
npm run build
```

构建产物输出到 `dist/` 目录。

::: warning 服务器配置要求
如果服务器内存低于 2GB，`npm ci` 和 `npm run build` 可能会因内存不足而失败。建议在本地构建后通过 FTP 上传 `dist/` 目录，或增加 SWAP 分区。
:::

### 第二步：在 aaPanel 创建网站

1. 登录 aaPanel 面板，进入 **网站** 菜单。
2. 点击 **添加站点**。
3. 填写以下信息：
   - **域名**：`example.com`
   - **根目录**：`/www/wwwroot/example.com`
   - **备注**：Stellar Theme
   - **FTP**：可选
   - **数据库**：不需要（前端项目无数据库，无需创建数据库）
4. 点击 **提交**。

### 第三步：上传构建产物

将项目 `dist/` 目录下的 **所有文件** 上传到网站根目录 `/www/wwwroot/example.com/`。

可使用 aaPanel 自带的 FTP 功能或文件管理器上传。

### 第四步：配置运行时环境

修改 `/www/wwwroot/example.com/env.js`：

```js
window.routerBase = '/'

window.settings = {
  title: 'Stellar',                    // 网站标题
  description: 'Stellar Panel',         // 网站描述
  assets_path: '/assets',
  theme: { color: 'default' },
  version: '1.0.0',
  background_url: '',                    // 自定义背景图 URL
  logo: '',                              // 自定义 Logo URL
  landing_theme_mode: 'dark',
  landing_page_enabled: true,
  telegram_group: 'https://t.me/your_group',
  api_error_contact: '',

  client_downloads: {
    windows: '',
    macos: '',
    android: '',
    ios: '',
    linux: '',
    router: '',
  },

  api: {
    // 使用同域自动模式，API 通过 Nginx 反向代理
    url_mode: 'auto',
    static_base_urls: [],
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '/api',            // 对应 Nginx 代理路径
    },
    check_enabled: false,
    proxy_enabled: false,
  },
}
```

### 第五步：配置 Nginx 反向代理

在 aaPanel 网站设置中修改 Nginx 配置：

1. 进入 **网站** → 点击域名进入设置 → **配置文件**。
2. 替换为以下配置（将 `127.0.0.1:8080` 替换为你的 XBoard 后端地址）：

```nginx
server {
    listen 80;
    server_name example.com;

    # 如果配置了 SSL，aaPanel 会自动添加 listen 443 配置，保留即可

    index index.html;
    root /www/wwwroot/example.com;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 100M;
    }

    # 静态资源长期缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # env.js 禁止缓存
    location = /env.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }

    # Vue Router History 模式回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. 点击 **保存**。

### 第六步：配置 SSL（可选但推荐）

1. 进入 **网站** → 点击域名进入设置 → **SSL**。
2. 选择 **Let's Encrypt**，勾选域名后点击 **申请**。
3. 申请成功后 aaPanel 会自动添加 HTTPS 配置。

::: info CDN 与 SSL
如果使用 CDN 加速，建议在 CDN 控制台配置 SSL 证书，源站使用 HTTP 即可。aaPanel 会自动处理 Let's Encrypt 证书的续签。
:::

### 第七步：验证部署

1. 浏览器访问 `http://example.com`（或 `https://example.com`）。
2. 如果能看到 Stellar 主题的落地页，说明部署成功。
3. 尝试注册、登录并进入控制台，验证 API 通信正常。

---

## 方式二：子目录部署

将 Stellar 部署在域名的子路径下，例如 `https://example.com/stellar/`。

### 第一步：构建项目

构建步骤与方式一相同，但在构建前确认 `.env.production` 中资源路径使用相对路径：

```env
VITE_BASE=./
```

然后执行构建：

```bash
npm ci
npm run build
```

### 第二步：创建子目录网站

1. 在 aaPanel 添加站点，域名填写 `example.com`。
2. 根目录设置为 `/www/wwwroot/example.com`。
3. 在根目录下创建子目录 `stellar`：
   ```bash
   mkdir -p /www/wwwroot/example.com/stellar
   ```
4. 将 `dist/` 目录下所有文件上传到 `/www/wwwroot/example.com/stellar/`。

### 第三步：配置运行时环境

修改 `/www/wwwroot/example.com/stellar/env.js`：

```js
// 子目录部署必须正确设置 routerBase
window.routerBase = '/stellar/'

window.settings = {
  title: 'Stellar',
  description: 'Stellar Panel',
  assets_path: '/stellar/assets',
  theme: { color: 'default' },
  version: '1.0.0',
  background_url: '',
  logo: '',
  landing_theme_mode: 'dark',
  landing_page_enabled: true,
  telegram_group: '',
  api_error_contact: '',

  client_downloads: {
    windows: '',
    macos: '',
    android: '',
    ios: '',
    linux: '',
    router: '',
  },

  api: {
    url_mode: 'auto',
    static_base_urls: [],
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '/api',
    },
    check_enabled: false,
    proxy_enabled: false,
  },
}
```

::: danger 子目录部署关键点
`window.routerBase` **必须**以 `/` 开头和结尾，正确写法为 `/stellar/`。如果写成 `stellar`、`/stellar` 或 `stellar/` 都会导致刷新页面后出现 404。
:::

### 第四步：配置 Nginx

在 aaPanel 网站配置文件中添加子目录专属配置：

```nginx
server {
    listen 80;
    server_name example.com;

    index index.html;
    root /www/wwwroot/example.com;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 100M;
    }

    # 子目录静态资源缓存
    location ~* ^/stellar/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # 子目录 env.js 禁止缓存
    location = /stellar/env.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }

    # 子目录 History 路由回退
    location /stellar/ {
        alias /www/wwwroot/example.com/stellar/;
        try_files $uri $uri/ /stellar/index.html;
    }

    # 根目录其他请求
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 第五步：验证

访问 `https://example.com/stellar/`，确认落地页正常显示。

---

## 配置 API 接入

根据你的部署架构选择合适的 API 接入方式。

### 方式 A：同域反向代理（推荐）

对应上面的教程配置，Nginx 将 `/api/` 转发到 XBoard 后端，前端 `env.js` 配置：

```js
api: {
  url_mode: 'auto',
  auto: {
    use_same_protocol: true,
    host: '',              // 留空使用当前域名
    append_path: '/api',
  },
  check_enabled: false,
  proxy_enabled: false,
}
```

### 方式 B：固定 API 地址（前后端不同域）

后端需要配置 CORS：

```js
api: {
  url_mode: 'static',
  static_base_urls: ['https://panel.example.com'],
  check_enabled: false,
  proxy_enabled: false,
}
```

### 方式 C：多地址 + 健康检测

配置多个 API 地址，前端自动检测可用性：

```js
api: {
  url_mode: 'static',
  static_base_urls: [
    'https://panel-a.example.com',
    'https://panel-b.example.com',
  ],
  check_enabled: true,
  check_path: '/api/v1/guest/comm/config',
  proxy_enabled: false,
}
```

### 方式 D：前端代理模式

通过自定义代理服务转发 API 请求：

```js
api: {
  url_mode: 'static',
  static_base_urls: ['https://panel.example.com'],
  proxy_enabled: true,
  proxy_url: '',                              // 同域可留空
  proxy_path: '/api-proxy',
  proxy_mode: 'base64Path',                   // 需与后端代理服务一致
}
```

对应 Nginx 配置（在 aaPanel 中添加）：

```nginx
location /api-proxy/ {
    rewrite ^/api-proxy/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    client_max_body_size 100M;
}
```

---

## 常见问题

### 1. 页面可以打开，但 API 请求全部失败

依次排查：

- 检查 `/www/wwwroot/your-site/env.js` 中 API 配置是否正确。
- 确认 XBoard 后端服务是否正常运行。
- 检查 aaPanel Nginx 配置中 `proxy_pass` 地址是否可达。
- 查看浏览器开发者工具 → Network 面板，看 API 请求返回的是 CORS 错误、404 还是 502。
- 如果跨域部署，确认后端已配置 CORS 允许前端域名。

### 2. 刷新子页面后出现 404

这是 Vue Router History 模式的常见问题。检查：

- **根目录部署**：确认 Nginx 配置中有 `try_files $uri $uri/ /index.html;`
- **子目录部署**：确认 `try_files $uri $uri/ /stellar/index.html;` 中的回退路径正确，且 `env.js` 中的 `window.routerBase` 与 Nginx 路径一致。

::: tip 配置生效提醒
在 aaPanel 中修改 Nginx 配置后，需要点击 **保存** 按钮。aaPanel 会自动重载 Nginx 配置，无需手动执行 `nginx -s reload`。
:::

### 3. 修改 env.js 后配置未生效

- 在 aaPanel 文件管理器中确认修改已保存。
- 清除浏览器缓存，或打开无痕模式访问。
- 在浏览器开发者工具 Network 面板查看 `env.js` 的响应内容是否为修改后的内容。
- 检查 Nginx 中 `location = /env.js` 的缓存配置是否正确（`expires -1`）。

### 4. aaPanel 中修改 Nginx 配置文件后网站无法访问

- aaPanel 会在保存配置时检查语法，如果报错会提示具体行号。
- 常见错误：花括号不匹配、缺少分号、`server_name` 重复。
- 使用 aaPanel 的 **网站** → **设置** → **配置文件** 中的 **备份** 功能，出错后可快速恢复。

### 5. 部署后落地页样式丢失或白屏

- 确认 `dist/` 目录中所有文件已上传，特别是 `assets/` 子目录。
- 检查浏览器控制台是否有 404 资源加载错误。
- 子目录部署时确认 `env.js` 中 `assets_path` 为 `/stellar/assets`。

::: details 关闭落地页（直接跳转登录页）
将 `env.js` 中的 `landing_page_enabled` 设置为 `false`，刷新页面后访问首页会自动跳转到登录页（未登录时）或仪表盘（已登录时）。

```js
landing_page_enabled: false,
```
:::

### 6. 想关闭落地页，直接跳转登录页

将 `env.js` 中的 `landing_page_enabled` 设置为 `false`：

```js
landing_page_enabled: false,
```

刷新页面后，访问首页会自动跳转到登录页（未登录时）或仪表盘（已登录时）。

---