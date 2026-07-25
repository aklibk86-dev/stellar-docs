# 常见问题

::: tip 排查思路
遇到问题建议按照以下顺序排查：检查 `env.js` 配置 → 查看浏览器开发者工具 → 检查 Nginx 配置 → 确认后端服务状态。
:::

## API 请求失败

### 页面可以打开，但 API 请求全部失败

**原因**：前端与后端 API 通信配置不正确。

**解决方法**：

1. 检查 `env.js` 中 API 配置是否正确
2. 确认后端服务是否正常运行
3. 查看浏览器开发者工具 → Network 面板，看 API 请求返回的是 CORS 错误、404 还是 502

::: warning 跨域部署注意
如果前端和后端部署在不同的域名下，请确认后端已配置 CORS 允许前端域名访问。

```nginx
# Nginx 中配置 CORS 示例
add_header Access-Control-Allow-Origin "https://your-frontend-domain.com";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type, Authorization";
```
:::

### API 请求 404

**原因**：API 代理路径配置错误。

**解决方法**：

1. 检查 `env.js` 中的 `api` 配置是否正确
2. 检查 Nginx 代理规则中的路径是否匹配
3. 确保后端服务已正确启动

## 页面白屏

**原因**：构建失败或资源路径错误。

**解决方法**：

1. 检查构建日志，确认构建是否成功完成
2. 确认 `env.js` 中的 `assets_path` 和 `base` 配置正确
3. 打开浏览器开发者工具 → Console 面板查看具体错误信息
4. 检查 `dist/` 目录是否包含所有必需文件

::: details 查看浏览器 Console 的方法
- **Chrome**：按 `F12` 或 `Ctrl+Shift+I` → Console 面板
- **Edge**：按 `F12` 或 `Ctrl+Shift+I` → Console 面板
- **Firefox**：按 `F12` 或 `Ctrl+Shift+K` → 控制台
:::

## 刷新页面 404

::: danger 最常见错误
这是 Vue Router History 模式部署中最常见的错误。Nginx 未正确配置单页应用回退规则。
:::

**原因**：Nginx 没有配置单页应用回退规则，导致直接访问子路径时 Nginx 找不到对应文件。

**解决方法**：

- **根目录部署**：确认 Nginx 配置中有以下规则：
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

- **子目录部署**：确认 `try_files` 的回退路径正确：
  ```nginx
  location /stellar/ {
      try_files $uri $uri/ /stellar/index.html;
  }
  ```

同时确认 `env.js` 中的 `routerBase` 与 Nginx 路径一致。

## env.js 配置未生效

**原因**：浏览器缓存或 Nginx 缓存导致旧配置被使用。

**解决方法**：

1. 确认修改已保存到 `env.js` 文件
2. 清除浏览器缓存，或打开无痕模式访问
3. 在浏览器开发者工具 Network 面板查看 `env.js` 的响应内容是否为修改后的内容
4. 检查 Nginx 中 `location = /env.js` 的缓存配置是否正确

```nginx
# 确保 env.js 不被缓存
location = /env.js {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

## 资源加载失败

**原因**：资源文件缺失或路径配置错误。

**解决方法**：

1. 确认 `dist/` 目录中所有文件已上传，特别是 `assets/` 子目录
2. 检查浏览器控制台是否有 404 资源加载错误
3. 子目录部署时确认 `env.js` 中 `assets_path` 配置正确（如 `/stellar/assets`）

::: details 检查资源加载
打开浏览器开发者工具 → Network 面板，刷新页面，筛选 CSS/JS 类型的请求，查看是否有红色标记的 404 请求。这些就是加载失败的资源。
:::

## Logo 不显示

**原因**：Logo 路径错误或文件不存在。

**解决方法**：

1. 检查 `env.js` 中 `logo` 配置的路径是否正确
2. 检查 Logo 文件是否存在于指定路径
3. 清除浏览器缓存后重新加载

## Nginx 配置问题

### 修改 Nginx 配置后网站无法访问

**原因**：Nginx 配置文件语法错误。

**解决方法**：

- aaPanel 会在保存配置时检查语法，如果报错会提示具体行号
- 常见错误：花括号不匹配、缺少分号、`server_name` 重复

::: tip 备份恢复
使用 aaPanel 的 **网站** → **设置** → **配置文件** 中的 **备份** 功能，出错后可快速恢复。
:::

## 关闭落地页

将 `env.js` 中的 `landing_page_enabled` 设置为 `false`，刷新页面后访问首页会自动跳转到登录页（未登录时）或仪表盘（已登录时）。

```js
landing_page_enabled: false,
```

---

::: tip 需要更多帮助？
如果以上方法无法解决您的问题，请提供详细的错误信息和相关日志，我们会尽快协助您排查。
:::
