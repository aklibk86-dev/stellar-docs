# aaPanel 一键部署 Stellar

使用宝塔面板（aaPanel）快速部署 Stellar 主题，适合新手操作。

::: tip 适用对象
本教程适用于已有 aaPanel 面板的用户。如果你使用的是宝塔国内版，操作方法基本相同。
:::

---

## 你需要准备什么

- ✅ 一台 Linux 服务器（已安装 aaPanel）
- ✅ aaPanel 已安装 **Nginx** 和 **Node.js 20+**（在应用商店搜索安装）
- ✅ 一个已解析到服务器的域名（如 `example.com`）
- ✅ XBoard 后端服务已安装并正常运行

---

## 第一步：构建项目

**这一步做什么**：把源代码变成可以直接运行的文件。

你可以在**本地电脑**或**服务器**上执行以下操作：

```bash
# 下载源码
git clone https://github.com/aklibk86-dev/stellar.git
cd stellar

# 安装依赖（第一次需要等待几分钟）
npm ci

# 构建生产版本
npm run build
```

构建完成后，项目目录下会出现一个 `dist/` 文件夹，里面就是我们需要的所有文件。

::: warning 如果服务器内存不够
如果服务器内存低于 2GB，构建可能会失败。建议在本地电脑构建好后，通过 FTP 上传 `dist/` 文件夹。
:::

---

## 第二步：在 aaPanel 创建网站

**这一步做什么**：告诉宝塔面板，我们要在这个域名下放一个网站。

1. 登录 aaPanel 面板，点击左侧的 **网站**
2. 点击 **添加站点**
3. 填写信息：
   - **域名**：输入你的域名，比如 `example.com`
   - **根目录**：保持默认 `/www/wwwroot/example.com`
   - **备注**：随便写点什么，比如 `Stellar`
   - **数据库**：不需要（这是前端项目，不用数据库）
4. 点击 **提交**

---

## 第三步：上传文件

**这一步做什么**：把刚才构建好的文件传到服务器上。

将 `dist/` 文件夹里的**所有文件**上传到 `/www/wwwroot/example.com/` 目录。

你可以用以下方式上传：
- aaPanel 自带的 **文件管理器**（点击左侧文件，找到对应目录，上传文件）
- FTP 工具（比如 FileZilla）

---

## 第四步：配置网站信息

**这一步做什么**：告诉 Stellar 你的网站叫什么名字、API 在哪里。

1. 在 aaPanel 文件管理器中，找到 `/www/wwwroot/example.com/env.js` 文件
2. 编辑这个文件，修改以下内容：

```js
window.routerBase = '/'

window.settings = {
  title: 'Stellar',                    // ← 改成你的网站名称
  description: '我的 VPN 服务',         // ← 改成你的网站描述
  landing_page_enabled: true,           // 是否显示落地页（true=显示，false=直接登录）
  telegram_group: 'https://t.me/xxx',  // ← 改成你的 Telegram 群组链接

  // API 配置（关键！）
  api: {
    url_mode: 'auto',
    auto: {
      use_same_protocol: true,
      host: '',
      append_path: '/api',            // API 请求会自动发到 /api 路径
    },
  },
}
```

::: info 其他配置
想了解更多配置项（如背景图、Logo、客户端下载链接等），请查看 [配置文件详解](/config/config)。
:::

---

## 第五步：配置 Nginx 反向代理

**这一步做什么**：让浏览器访问 `/api` 的请求自动转发到 XBoard 后端。

1. 在 aaPanel 网站列表中，点击你的域名进入设置
2. 点击 **配置文件**
3. 替换为以下配置（把 `127.0.0.1:8080` 改成你的 XBoard 后端地址）：

```nginx
server {
    listen 80;
    server_name example.com;           # ← 你的域名

    index index.html;
    root /www/wwwroot/example.com;     # ← 网站根目录

    # ===== API 反向代理（关键！）=====
    # 把 /api 开头的请求转发到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;  # ← 改这里！改成你的后端地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # ===== 静态资源缓存（加速网站）=====
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;                    # 30天内不重新下载
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ===== env.js 禁止缓存（修改后立即生效）=====
    location = /env.js {
        expires -1;                     # 不缓存
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }

    # ===== Vue Router 回退规则（防止刷新页面 404）=====
    location / {
        try_files $uri $uri/ /index.html;  # 找不到文件就返回 index.html
    }
}
```

4. 点击 **保存**

---

## 第六步：配置 SSL（推荐）

**这一步做什么**：让网站支持 HTTPS，更安全。

1. 在网站设置中点击 **SSL**
2. 选择 **Let's Encrypt**，勾选你的域名
3. 点击 **申请**
4. 申请成功后，aaPanel 会自动配置好 HTTPS

---

## 验证部署

打开浏览器，访问你的域名（如 `https://example.com`）：

- 如果能看到 Stellar 的落地页，说明部署成功
- 尝试注册、登录，验证 API 通信是否正常

---

## 常见问题

### 1. 页面可以打开，但登录/注册失败

**原因**：API 连接配置错误。

**解决方法**：
- 检查 `env.js` 中的 `api` 配置是否正确
- 检查 Nginx 配置中的 `proxy_pass` 地址是否正确
- 确认 XBoard 后端服务是否正常运行（可以用 `http://127.0.0.1:8080` 测试）

### 2. 刷新页面后出现 404

**原因**：Nginx 没有配置单页应用回退规则。

**解决方法**：
- 确认 Nginx 配置中有 `try_files $uri $uri/ /index.html;`
- 修改后点击 aaPanel 的 **保存** 按钮

### 3. 修改 env.js 后配置没生效

**原因**：浏览器缓存了旧的配置文件。

**解决方法**：
- 按 `Ctrl+Shift+Delete` 清除浏览器缓存
- 或者打开**无痕模式**访问
- 检查 Nginx 配置中 `location = /env.js` 是否设置了 `expires -1`

---

## 高级选项

### 子目录部署

如果你想把 Stellar 部署在域名的子路径下（如 `https://example.com/stellar/`），请展开查看详细步骤。

::: details 点击展开子目录部署教程

#### 第一步：创建子目录

在 aaPanel 文件管理器中，在网站根目录下创建 `stellar` 文件夹，将 `dist/` 中的文件上传到这个文件夹。

#### 第二步：修改 env.js

```js
window.routerBase = '/stellar/'       // ← 必须以 / 开头和结尾
window.settings = {
  assets_path: '/stellar/assets',      // ← 资源路径也要改
  // ... 其他配置不变
}
```

#### 第三步：修改 Nginx 配置

在 Nginx 配置中添加子目录规则：

```nginx
# 子目录路由回退
location /stellar/ {
    alias /www/wwwroot/example.com/stellar/;
    try_files $uri $uri/ /stellar/index.html;
}
```

:::

### 跨域 API 配置

如果你的前端和后端部署在不同域名下，需要使用静态 API 地址。

::: details 点击展开跨域配置

```js
api: {
  url_mode: 'static',
  static_base_urls: ['https://api.example.com'],  // ← 直接写后端地址
  check_enabled: false,
}
```

> 注意：后端需要配置 CORS 允许前端域名访问。

:::

### 多节点 API 配置

如果你有多个后端节点，想实现自动故障转移，可以开启健康检测。

::: details 点击展开多节点配置

```js
api: {
  url_mode: 'static',
  static_base_urls: [
    'https://api1.example.com',
    'https://api2.example.com',
  ],
  check_enabled: true,                // 开启健康检测
  check_path: '/api/v1/guest/comm/config',
}
```

前端会自动检测列表中的地址，选择第一个可用的后端。

:::
