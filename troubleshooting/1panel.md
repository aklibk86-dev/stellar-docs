# 1Panel 安装常见问题

::: tip 排查顺序
遇到问题建议按以下顺序排查：检查伪静态配置 → 检查 `env.js` 配置 → 检查反向代理规则 → 检查浏览器开发者工具。
:::

## 刷新页面 404（Vue Router History 模式）

::: danger 必配项
Vue Router History 模式**必须**配置伪静态规则，否则所有子页面（如 `/dashboard`）刷新都会 404。**这是部署后最常见的错误**。
:::

**原因**：Nginx/OpenResty 没有配置单页应用回退规则。

**解决方法**：

在 1Panel 网站设置中，找到 **伪静态** 配置项，添加以下规则：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

::: tip 配置步骤
1. 登录 1Panel 面板
2. 进入 **网站** → 选择对应网站 → **设置**
3. 找到 **伪静态** 配置项
4. 添加上述 Nginx 规则
5. 点击保存
:::

::: warning 子目录部署
如果是子目录部署（如 `http://your-domain.com/stellar/`），需要将回退路径改为子目录路径：

```nginx
location /stellar/ {
    try_files $uri $uri/ /stellar/index.html;
}
```

同时确保 `env.js` 中的 `routerBase` 与子目录路径一致。
:::

## API 请求返回 404

**原因**：反向代理路径配置错误。

**解决方法**：

1. 检查 `env.js` 中 `api.auto.append_path` 是否与反向代理路径一致
2. 检查 1Panel 反向代理的代理地址是否正确（如 `http://127.0.0.1:7001`）
3. 确认后端服务已启动

::: info 反向代理配置检查
在 1Panel 网站设置中：
1. 进入 **反向代理** 配置项
2. 确认代理地址指向正确的后端服务地址
3. 确认路径前缀（如 `/api/`）与 `env.js` 中的配置一致
4. 保存后测试 API 是否正常
:::

## 样式或资源加载失败

**原因**：资源路径配置错误。

**解决方法**：

1. 确认构建产物的 `assets/` 目录存在且包含文件
2. 检查 `env.js` 中 `assets_path` 配置（通常保持 `/assets`）
3. 浏览器打开开发者工具 → Network 面板，查看加载失败的资源

::: details 查看缺失的资源
打开浏览器开发者工具（F12）→ Network 面板，刷新页面后：

1. 点击 CSS 或 JS 筛选标签
2. 查看是否有红色标记的 404 请求
3. 点击失败的请求，查看请求的完整 URL
4. 对比 URL 与实际文件路径，找出路径差异
:::

## 1Panel 网站目录无法选择

**原因**：1Panel 默认限制目录选择范围，无法选择自定义路径。

**解决方法**：

将构建产物放在 1Panel 的默认网站目录下：

```bash
# 1Panel 默认网站目录路径
/opt/1panel/1panel/apps/openresty/openresty/www/sites/
# 或
/www/wwwroot/

# 将 dist/ 复制到默认目录
cp -r /opt/stellar/dist /opt/1panel/1panel/apps/openresty/openresty/www/sites/stellar/
```

::: tip 使用软链接
也可以使用软链接（Symbolic Link）将自定义目录链接到 1Panel 默认目录：

```bash
ln -s /your/custom/path/stellar /opt/1panel/1panel/apps/openresty/openresty/www/sites/stellar
```
:::

## Docker 镜像构建后运行时资源缺失

**原因**：`Dockerfile` 中未正确配置 `.dockerignore`，导致 `node_modules` 等目录被包含在构建上下文中，或缺失必要文件。

**解决方法**：

确保 `.dockerignore` 文件中排除了不必要的文件：

```
node_modules
.git
*.md
.gitignore
```

同时确认构建命令使用了 `COPY` 指令复制了正确的目录：

```dockerfile
COPY dist/ /app/dist/
COPY public/env.js /app/dist/env.js
```

---

::: tip 需要更多帮助？
如果以上方法无法解决您的问题，请提供详细的错误信息（浏览器 Console 截图、Nginx 配置等），我们会尽快协助您排查。
:::
