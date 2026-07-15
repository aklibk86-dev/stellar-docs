# Docker 部署指南

使用 Docker 容器化部署 Stellar 主题前端，支持多阶段构建和灵活配置。

::: tip 推荐使用 Docker Compose
Docker Compose 可以简化多容器管理，建议优先使用 `docker compose up -d` 方式部署。如需自定义 Nginx 配置，可以通过 volume 挂载覆盖。
:::

---

## 项目结构

部署所需的文件如下：

```
stellar-src/
├── Dockerfile              # Docker 多阶段构建文件
├── docker-compose.yml      # Docker Compose 编排配置（推荐使用）
├── nginx.conf.example      # Nginx 配置模板（构建时复制到容器）
├── public/
│   └── env.js              # 运行时配置（建议挂载到容器外管理）
└── ...                     # 其他源代码文件
```

---

## 方式一：Docker Compose 部署（推荐）

### 1. 配置运行时参数

编辑 [`public/env.js`](public/env.js)，按实际环境修改以下关键配置：

```js
window.routerBase = '/'                    // 路由基础路径
window.settings = {
  title: 'Stellar',                        // 站点标题
  description: 'Stellar Panel',            // 站点描述
  logo: '',                                // Logo URL（留空使用默认图标）
  api: {
    url_mode: 'auto',                      // API 地址模式
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '/api'                  // API 路径后缀
    }
  }
}
```

### 2. 构建并启动

```bash
# 构建并后台启动
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f
```

::: warning env.js 权限注意
挂载 `env.js` 时使用了 `:ro`（只读）标志，容器内无法修改此文件。如需修改配置，请在宿主机上编辑后重启容器。
:::

### 3. 访问站点

浏览器打开 `http://localhost:8080` 即可访问。

---

## 方式二：纯 Docker 部署

### 1. 构建镜像

```bash
docker build -t stellar-theme .
```

### 2. 运行容器

```bash
docker run -d \
  --name stellar \
  -p 8080:80 \
  -v $(pwd)/public/env.js:/usr/share/nginx/html/env.js:ro \
  --restart unless-stopped \
  stellar-theme
```

参数说明：
- `-p 8080:80`：将宿主机 8080 端口映射到容器 80 端口
- `-v`：将 `env.js` 挂载到容器内（只读），方便修改配置无需重新构建
- `--restart unless-stopped`：容器退出时自动重启

---

## 方式三：构建产物直接部署（适合已有 Nginx 环境）

如果你已有 Nginx 环境，可以直接构建前端产物部署：

### 1. 构建

```bash
# 安装依赖
npm ci

# 构建生产包
npm run build
```

### 2. 部署

将 `dist/` 目录中所有文件上传到服务器，参照 [`nginx.conf.example`](nginx.conf.example) 配置 Nginx，然后重载配置：

```bash
nginx -s reload
```

---

## 关键配置说明

::: details API 地址配置详解
点击展开查看三种 API 模式的详细说明。
:::

### API 地址配置

在 [`public/env.js`](public/env.js) 中配置 API 连接方式：

| 模式 | 配置 | 适用场景 |
|------|------|---------|
| API 反向代理（推荐） | `url_mode: 'auto'` + `auto.append_path: '/api'` | 前后端同域，Nginx 转发 `/api/` 到后端 |
| CORS 直连 | `url_mode: 'static'` + `static_base_urls: ['https://api.example.com']` | 前后端不同域，后端配置 CORS |
| 前端代理 | `proxy_enabled: true` + `proxy_path: '/api-proxy'` | 前后端不同域，Nginx 代理转发 |

#### 场景示例：API 反向代理

这是最常见的部署方式。修改 [`docker-compose.yml`](docker-compose.yml) 添加后端代理：

```yaml
services:
  stellar:
    # ... 原有配置 ...
    volumes:
      - ./public/env.js:/usr/share/nginx/html/env.js:ro

  # 添加 XBoard 后端容器（如果后端也在 Docker 中）
  xboard:
    image: your-xboard-image
    container_name: xboard
    restart: unless-stopped
    networks:
      - stellar-network
```

然后修改 [`nginx.conf.example`](nginx.conf.example)（或自定义 Nginx 配置挂载到容器），添加反向代理：

```nginx
location /api/ {
    proxy_pass http://xboard:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    client_max_body_size 100M;
}
```

### Logo 自定义

在 [`public/env.js:37`](public/env.js:37) 中设置 Logo URL：

```js
logo: '/logo.png',
```

将 Logo 图片放入容器或通过 volume 挂载：

```yaml
volumes:
  - ./custom-logo.png:/usr/share/nginx/html/logo.png:ro
```

### 时区设置

::: info 时区
容器默认使用 `Asia/Shanghai` 时区。如需修改，编辑 [`Dockerfile`](Dockerfile) 中的时区相关行或通过环境变量设置：
:::

```yaml
environment:
  - TZ=Asia/Shanghai
```

---

## Nginx 配置

项目提供完整的 [`nginx.conf.example`](nginx.conf.example) 配置文件模板，包含：

| 场景 | 说明 |
|------|------|
| 场景一：根目录部署 + API 反向代理（推荐） | 单域名，Nginx 转发 `/api/` 到后端 |
| 场景二：子目录部署 | 通过 `/stellar/` 子路径访问 |
| 场景三：API 代理模式 | 前端 `proxy_enabled`，Nginx 代理转发 |
| 场景四：CDN 加速部署 | 静态资源走 CDN，Nginx 配置 CDN 回源 |

默认 [`Dockerfile`](Dockerfile) 使用 `nginx.conf.example` 作为 Nginx 配置。如需自定义配置，可以将本地 Nginx 配置文件挂载到容器：

```yaml
volumes:
  - ./my-nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

---

## 生产环境建议

### 1. 资源限制

```yaml
services:
  stellar:
    # ... 原有配置 ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

### 2. 使用 .dockerignore

在项目根目录创建 [`.dockerignore`](.dockerignore) 文件，忽略不需要的文件以加速构建：

```gitignore
node_modules/
.git/
*.md
.gitignore
.env*
.vscode/
tutorials/
dist/
```

### 3. HTTPS 配置

::: danger 安全提醒
生产环境**必须启用 HTTPS**。建议在容器前使用反向代理（如 Nginx、Caddy、Traefik）终结 TLS 证书，或使用 Docker 网络中的反向代理容器统一管理证书。切勿直接暴露容器端口到公网而不加 TLS。
:::

---

## 常用命令速查

```bash
# 构建并启动
docker compose up -d

# 停止
docker compose down

# 重新构建（修改 Dockerfile 后）
docker compose up -d --build

# 查看日志
docker compose logs -f stellar

# 进入容器
docker exec -it stellar sh

# 仅构建镜像
docker build -t stellar-theme .
```

---

## 故障排查

::: tip 排查思路
遇到问题建议按照以下顺序排查：检查容器日志 → 检查 `env.js` 配置 → 检查 Nginx 代理规则 → 检查后端服务状态。
:::

| 问题 | 原因 | 解决方法 |
|------|------|---------|
| API 请求 404 | API 代理路径配置错误 | 检查 `env.js` 中的 `api` 配置和 Nginx 代理规则 |
| 页面白屏 | 构建失败或资源路径错误 | 检查构建日志，确认 `assets_path` 和 `base` 配置 |
| Logo 不显示 | Logo 路径错误或文件未挂载 | 检查 `logo` 配置和 volume 挂载路径 |
| 刷新页面 404 | Nginx 未配置 History 模式回退 | 添加 `try_files $uri $uri/ /index.html;` |
| 时区不对 | 未正确设置时区 | 设置环境变量 `TZ=Asia/Shanghai` |
