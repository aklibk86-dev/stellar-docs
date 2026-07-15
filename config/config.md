# Stellar 主题 — 配置文件说明

## 概述

配置文件为 [`public/env.js`](public/env.js)，是一个**运行时配置**文件。它通过 [`index.html`](index.html) 中的 `<script>` 标签在应用启动前加载，生成 [`window.settings`](public/env.js:15) 全局对象。

**核心特点：**

- **修改后无需重新构建**，刷新页面即可生效
- **不含私密信息**（密码、Token、订阅链接等），所有值对浏览器可见
- 空字符串 `''` 和空数组 `[]` 均为安全占位值，表示"不启用该功能"或"使用默认行为"

---

## 配置项详解

### 1. 基础路由

```js
window.routerBase = '/'
```

| 部署方式 | 配置值 | 示例 |
|---------|--------|------|
| 根目录部署 | `'/'` | `https://example.com/` |
| 子目录部署 | `'/stellar/'` | `https://example.com/stellar/` |

> **注意**：子目录路径必须以 `/` 开头和结尾。

---

### 2. 站点信息

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| [`title`](public/env.js:17) | `string` | `'Stellar'` | 浏览器标签页标题、侧边栏品牌名称 |
| [`description`](public/env.js:20) | `string` | `'Stellar Panel'` | 站点简介，用于页面描述或 SEO |
| [`assets_path`](public/env.js:23) | `string` | `'/assets'` | 静态资源目录，一般保持默认 |
| [`version`](public/env.js:31) | `string` | `'1.0.0'` | 前端展示的版本号，不影响后端 |

---

### 3. 主题与外观

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| [`theme.color`](public/env.js:27) | `string` | `'default'` | 主题主色，`'default'` 表示项目默认配色 |
| [`background_url`](public/env.js:34) | `string` | `''` | 登录页/全局背景图 URL，留空使用默认背景 |
| [`logo`](public/env.js:37) | `string` | `''` | 品牌 Logo URL，留空使用默认图标或文字标识 |
| [`landing_theme_mode`](public/env.js:40) | `string` | `'dark'` | 落地页主题，可选 `'dark'` / `'light'` |

---

### 4. 落地页控制

```js
landing_page_enabled: true,
```

| 值 | 行为 |
|----|------|
| `true` | 访问首页时显示落地页（Landing Page） |
| `false` | 访问首页时直接跳转到登录页或仪表盘 |

---

### 5. 社交与联系

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| [`telegram_group`](public/env.js:46) | `string` | `''` | Telegram 群组完整 URL。留空时尝试从后端配置文件读取，仍为空则隐藏入口 |
| [`api_error_contact`](public/env.js:49) | `string` | `''` | API 全部检测失败时展示的联系信息，可填写客服 URL 或提示文字 |

---

### 6. 客户端下载

```js
client_downloads: {
  windows: '',
  macos: '',
  android: '',
  ios: '',
  linux: '',
  router: '',
},
```

| 平台 | key | 说明 |
|------|-----|------|
| Windows | `windows` | Windows 客户端下载页 |
| macOS | `macos` | macOS 客户端下载页 |
| Android | `android` | Android 客户端下载页 |
| iOS | `ios` | iOS 客户端下载页 |
| Linux | `linux` | Linux 客户端下载页 |
| 路由器 | `router` | 路由器/OpenWrt 客户端下载页 |

**行为规则：**

- 填入完整 URL → 该平台在仪表盘显示下载入口
- 留空 `''` → 该平台不显示下载入口

**示例：**

```js
client_downloads: {
  windows: 'https://github.com/example/clients/releases',
  macos: 'https://github.com/example/clients/releases',
  android: '',
  ios: '',
  linux: '',
  router: '',
},
// 仅 Windows 和 macOS 显示下载入口
```

---

### 7. API 连接配置（核心）

#### 7.1 URL 获取模式：`url_mode`

```js
api: {
  url_mode: 'auto',   // 'auto' | 'static'
  static_base_urls: [],
  auto: {
    use_same_protocol: true,
    host: '',
    append_path: '',
  },
  check_enabled: false,
  check_path: '/api/v1/guest/comm/config',
  proxy_enabled: false,
  proxy_url: '',
  proxy_path: '/api-proxy',
  proxy_mode: 'base64Path',
}
```

| 模式 | 值 | 行为 |
|------|-----|------|
| **自动拼接** | `'auto'` | 根据前端域名自动拼接后端 API 地址（最常用，适合前后端同域部署） |
| **静态列表** | `'static'` | 从固定地址列表中选取后端 API（适合多节点或多域名后端） |

#### 7.2 自动拼接模式（`url_mode: 'auto'`）

```js
auto: {
  use_same_protocol: true,   // 是否使用与前端相同的协议（http/https）
  host: '',                   // 后端主机，留空表示与前端同主机
  append_path: '',            // 路径后缀，如 '/api/v1'
}
```

**拼接逻辑：**

| `use_same_protocol` | `host` | 结果 | 适用场景 |
|---------------------|--------|------|----------|
| `true` | `''` | `//当前域名/append_path` | 前后端同域部署 |
| `true` | `'api.example.com'` | `//api.example.com/append_path` | 同协议跨子域 |
| `false` | `'http://192.168.1.100:8080'` | `http://192.168.1.100:8080/append_path` | 开发调试或内网直连 |

#### 7.3 静态地址列表模式（`url_mode: 'static'`）

```js
static_base_urls: [
  'https://api1.example.com',
  'https://api2.example.com',
]
```

**行为：**

- 当 `check_enabled: true` 时，前端会检测列表中的地址，自动选择**第一个可用的**后端
- 当 `check_enabled: false` 时，直接使用列表中的**第一个地址**

#### 7.4 健康检测

| 字段 | 默认值 | 说明 |
|------|--------|------|
| [`check_enabled`](public/env.js:76) | `false` | 是否启用 API 健康检测 |
| [`check_path`](public/env.js:77) | `'/api/v1/guest/comm/config'` | 检测请求的 API 路径 |

**启用检测的典型场景：**

```js
url_mode: 'static',
static_base_urls: [
  'https://hk-node.example.com',
  'https://jp-node.example.com',
  'https://us-node.example.com',
],
check_enabled: true,
```

> 前端会向每个地址请求 `check_path`，选择最先响应的作为可用后端，实现故障转移。

#### 7.5 正向代理

| 字段 | 默认值 | 说明 |
|------|--------|------|
| [`proxy_enabled`](public/env.js:80) | `false` | 是否启用正向代理转发 |
| [`proxy_url`](public/env.js:81) | `''` | 代理服务器地址 |
| [`proxy_path`](public/env.js:82) | `'/api-proxy'` | 代理路径前缀 |
| [`proxy_mode`](public/env.js:83) | `'base64Path'` | 代理寻址模式 |

> 适用于需要代理中转的 CORS 或内网穿透场景。通常保持禁用。

---

## 完整的配置示例

### 场景 1：前后端同域部署（最简配置）

```js
window.routerBase = '/'
window.settings = {
  title: 'My VPN Service',
  description: 'Fast & Secure VPN',
  landing_page_enabled: false,
  client_downloads: {
    windows: 'https://example.com/download/windows',
    macos: 'https://example.com/download/macos',
    android: 'https://example.com/download/android',
    ios: 'https://example.com/download/ios',
    linux: '',
    router: '',
  },
  api: {
    url_mode: 'auto',
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '',
    },
    check_enabled: false,
  },
}
```

### 场景 2：多节点后端 + 健康检测

```js
window.settings = {
  title: 'Global VPN',
  description: 'Worldwide secure proxy service',
  api: {
    url_mode: 'static',
    static_base_urls: [
      'https://hk.api.example.com',
      'https://jp.api.example.com',
      'https://us.api.example.com',
    ],
    check_enabled: true,
    check_path: '/api/v1/guest/comm/config',
  },
}
```

### 场景 3：子目录部署 + 客服联系

```js
window.routerBase = '/stellar/'
window.settings = {
  title: 'Stellar Dashboard',
  background_url: 'https://cdn.example.com/bg.jpg',
  logo: 'https://cdn.example.com/logo.svg',
  telegram_group: 'https://t.me/my_group',
  api_error_contact: 'https://t.me/admin',
  api: {
    url_mode: 'auto',
    auto: {
      use_same_protocol: true,
      host: 'api.example.com',
      append_path: '/stellar',
    },
  },
}
```

---

## 注意事项

1. **私密信息禁止**：此文件端暴露在浏览器中，禁止填写密码、Token、订阅链接等敏感信息
2. **修改即生效**：修改此文件后无需 `npm run build`，直接刷新浏览器即可
3. **Vite 开发服务器**：开发模式下，修改后保存文件，刷新页面即可，Vite 热更新不处理此文件
4. **`auto` 模式与 `static` 模式的区别**：
   - `auto` = 前端域名决定后端地址（适合标准单域部署）
   - `static` = 硬编码后端地址列表（适合多节点、多 IP、故障转移）
5. **`check_enabled`** 开启后，每次页面加载会发起检测请求，增加少量加载时间
