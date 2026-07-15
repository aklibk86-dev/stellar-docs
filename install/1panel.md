# 1Panel 部署指南

使用 1Panel 面板部署 Stellar 主题前端，支持容器化部署和静态站点两种方式。

::: tip 两种方式怎么选？
- **Docker Compose 部署**：适合已有 Docker 环境，希望全容器化管理的用户
- **静态站点部署**（推荐）：适合使用 1Panel 管理网站，配置更灵活
:::

---

## 前提条件

- 已安装 [1Panel](https://github.com/1Panel-dev/1Panel) Linux 面板
- 已安装 **OpenResty**（创建网站时自动安装）或 **Docker**（容器化部署时使用）
- 已准备域名（可选，也可直接通过 IP + 端口访问）

---

## 方式一：Docker Compose 部署（1Panel 容器管理）

### 1. 准备项目文件

将 Stellar 主题源码上传到服务器，例如 `/opt/stellar-src/`：

```bash
# 上传后目录结构如下
/opt/stellar-src/
├── Dockerfile
├── docker-compose.yml
├── public/
│   └── env.js
├── nginx.conf.example
└── ...
```

### 2. 配置运行时参数

编辑 [`public/env.js`](public/env.js)，修改 API 地址等配置：

::: warning
修改 `env.js` 后需要重启容器才能生效。建议在启动前确认配置正确。
:::

```js
window.routerBase = '/'
window.settings = {
  title: 'Stellar',
  api: {
    url_mode: 'auto',
    auto: {
      append_path: '/api'
    }
  }
}
```

### 3. 1Panel 创建 Docker Compose 项目

操作步骤：

1. 登录 1Panel 面板
2. 进入 **容器** → **Compose**
3. 点击 **创建 Compose**
4. 填写以下信息：
   - **名称**：`stellar`
   - **来源**：`从文件创建`
   - **Compose 内容**：上传或粘贴 [`docker-compose.yml`](docker-compose.yml) 内容
   - **路径**：`/opt/stellar-src/docker-compose.yml`

5. 点击 **确认**，1Panel 会自动构建镜像并启动容器

### 4. 访问验证

在 1Panel **容器** → **容器** 列表中查看 `stellar` 容器的运行状态。访问 `http://服务器IP:8080` 即可查看效果。

---

## 方式二：1Panel 网站 - 静态站点部署（推荐）

### 1. 构建前端产物

在服务器上安装 Node.js（可通过 1Panel **应用商店** 安装），或本地构建后上传。

#### 方法 A：服务器构建

```bash
# 进入项目目录
cd /opt/stellar-src

# 安装依赖
npm ci

# 构建
npm run build

# 构建产物在 dist/ 目录
```

#### 方法 B：本地构建后上传

```bash
# 本地执行
npm ci
npm run build

# 将 dist/ 目录打包上传到服务器
scp -r dist/ root@服务器IP:/opt/stellar/dist/
```

### 2. 修改 env.js 配置

编辑 [`public/env.js`](public/env.js)，按实际环境修改：

```js
window.routerBase = '/'
window.settings = {
  title: 'Stellar',
  description: 'Stellar Panel',
  logo: '',
  api: {
    url_mode: 'auto',
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '/api'
    }
  }
}
```

> 将修改后的 `env.js` 复制到构建产物的根目录（`dist/env.js`），替换默认文件。

### 3. 1Panel 创建网站

操作步骤：

1. 登录 1Panel 面板
2. 进入 **网站** → **网站**
3. 点击 **创建网站**
4. 选择 **静态网站**，填写：
   - **来源**：`反向代理`（如果同域部署 API）或 `纯静态`
   - **域名**：`your-domain.com`（留空则通过 IP 访问）
   - **端口**：`80`（HTTP）或 `443`（HTTPS）
   - **网站目录**：`/opt/stellar/dist`（构建产物路径）
   - **默认文档**：`index.html`

5. 点击 **确认** 创建网站

### 4. 配置 API 反向代理（同域部署推荐）

在 1Panel 网站管理页面中：

1. 进入刚创建的网站 **管理**
2. 点击 **反向代理** → **添加反向代理**
3. 填写：
   - **名称**：`api`
   - **代理地址**：`http://127.0.0.1:8080`（XBoard 后端地址）
   - **代理路径**：`/api/`
   - **发送域名**：`$host`

4. 点击 **确认**

::: info 反向代理原理
1Panel 的 OpenResty 会自动将 `/api/` 路径的请求转发到后端服务，前端和 API 处于同一域名下，因此**无需配置 CORS 跨域**。这是最推荐的部署方式。
:::

### 5. 配置伪静态（Vue Router History 模式）

在 1Panel 网站管理页面中：

1. 进入 **伪静态**
2. 选择 **伪静态模板**：`其他`
3. 输入以下规则：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

4. 点击 **保存**

### 6. 配置静态资源缓存（可选）

在 **伪静态** 中补充以下规则：

```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# env.js 不缓存
location = /env.js {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

### 7. 部署验证

1. 进入 1Panel **网站** → **网站**，确认网站状态为 `运行中`
2. 通过配置的域名或 `http://服务器IP` 访问
3. 验证 API 是否正常工作

---

## 方式三：1Panel 网站 - 反向代理部署

如果已有其他 Web 服务器运行静态文件，或者需要将 Stellar 部署到子路径，可以使用反向代理方式。

### 1. 构建前端产物

参见方式二步骤 1。

### 2. 1Panel 创建反向代理网站

1. 进入 **网站** → **网站** → **创建网站**
2. 选择 **反向代理**
3. 填写：
   - **域名**：`your-domain.com`
   - **端口**：`80` 或 `443`
   - **代理地址**：`http://127.0.0.1:8081`（用于托管静态资源的 HTTP 服务）

### 3. 使用 Nginx 容器或 Python HTTP 服务托管静态资源

```bash
# 方法 1：使用 Python 临时托管（仅用于测试）
cd /opt/stellar/dist
python3 -m http.server 8081

# 方法 2：使用 Nginx Docker 容器
docker run -d \
  --name stellar-static \
  -p 8081:80 \
  -v /opt/stellar/dist:/usr/share/nginx/html:ro \
  nginx:alpine
```

### 4. 配置伪静态

在 1Panel 反向代理网站的 **伪静态** 中添加：

```nginx
location / {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 配置详解

### API 连接方案对比

| 方案 | 配置方式 | 优点 | 缺点 |
|------|---------|------|------|
| **反向代理（推荐）** | 1Panel 网站 → 反向代理 → `/api/` → 后端 | 同域无跨域问题 | 需 1Panel 管理 |
| **CORS 直连** | `env.js` 配置 `static_base_urls` | 架构简单 | 后端需配置跨域 |
| **前端代理模式** | `env.js` 配置 `proxy_enabled` | 灵活 | Nginx 配置较复杂 |

### 反向代理配置示例

```
1Panel 反向代理规则：

路径：/api/
代理地址：http://127.0.0.1:8080
```

对应的 `env.js` 配置：

```js
api: {
  url_mode: 'auto',
  auto: {
    append_path: '/api'
  }
}
```

### HTTPS 配置

::: tip Let's Encrypt 自动续签
1Panel 支持自动申请和续签 Let's Encrypt 证书，配置后无需手动管理证书有效期。
:::

1Panel 支持自动申请和续签 Let's Encrypt 证书：

1. 进入 **网站** → **网站** → 选择站点 → **管理**
2. 点击 **HTTPS**
3. 勾选 **启用 HTTPS**
4. 选择 **证书** → **申请 Let's Encrypt 证书**
5. 填写邮箱地址，点击 **确认**

1Panel 会自动完成证书申请和续签。

### Logo 自定义

1. 将 Logo 图片上传到网站目录，例如 `/opt/stellar/dist/logo.png`
2. 修改 [`public/env.js`](public/env.js)：
   ```js
   logo: '/logo.png',
   ```

---

## 常见问题

### 刷新页面 404（Vue Router History 模式）

::: danger 必配项
Vue Router History 模式必须配置伪静态规则，否则所有子页面（如 `/dashboard`）刷新都会 404。**这是部署后最常见的错误**。
:::

**原因**：Nginx/OpenResty 没有配置单页应用回退。

**解决**：在 1Panel 网站 **伪静态** 中添加：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### API 请求返回 404

**原因**：反向代理路径配置错误。

**解决**：
1. 检查 `env.js` 中 `api.auto.append_path` 是否与反向代理路径一致
2. 检查 1Panel 反向代理的代理地址是否正确
3. 确认后端服务已启动

### 样式或资源加载失败

**原因**：资源路径配置错误。

**解决**：
1. 确认构建产物的 `assets/` 目录存在且包含文件
2. 检查 `env.js` 中 `assets_path` 配置（通常保持 `/assets`）
3. 浏览器打开开发者工具 → Network 面板，查看加载失败的资源

### 1Panel 网站目录无法选择

::: details 解决方法
1Panel 默认限制目录选择范围。将构建产物放在 1Panel 的默认网站目录下可解决此问题。
:::

**原因**：1Panel 默认限制目录选择范围。

**解决**：将构建产物放在 1Panel 的默认网站目录下，例如：

```bash
# 1Panel 默认网站目录
/opt/1panel/1panel/apps/openresty/openresty/www/sites/
# 或
/www/wwwroot/

# 将 dist/ 复制过去
cp -r /opt/stellar/dist /opt/1panel/1panel/apps/openresty/openresty/www/sites/stellar/
```

---

## 快速部署参考

```bash
# 1. 上传项目并构建
cd /opt
git clone https://github.com/your-repo/stellar-src.git
cd stellar-src
npm ci
npm run build

# 2. 修改 env.js 配置
vim public/env.js

# 3. 将 env.js 覆盖到构建产物
cp public/env.js dist/env.js

# 4. 1Panel 创建静态网站，目录指向 dist/
# 5. 1Panel 配置反向代理 /api/ → 后端
# 6. 1Panel 配置伪静态 history 模式
# 7. 1Panel 配置 HTTPS 证书
```

---