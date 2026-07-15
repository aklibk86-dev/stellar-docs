# aaPanel 安装常见问题

::: tip 问题排查顺序
遇到问题建议按以下顺序排查：检查 `env.js` 配置 → 查看 Nginx 配置 → 检查浏览器开发者工具 → 确认后端服务状态。
:::

## 1. 页面可以打开，但 API 请求全部失败

**原因**：前端与后端 API 通信配置不正确。

**解决方法**：

依次排查以下项目：

1. 检查 `/www/wwwroot/your-site/env.js` 中 API 配置是否正确
2. 确认 XBoard 后端服务是否正常运行
3. 检查 aaPanel Nginx 配置中 `proxy_pass` 地址是否可达（如 `http://127.0.0.1:7001`）
4. 查看浏览器开发者工具 → Network 面板，看 API 请求返回的是 CORS 错误、404 还是 502

::: warning 跨域部署注意
如果前端和后端部署在不同的域名下，请确认后端已配置 CORS 允许前端域名访问。

```nginx
# Nginx 中配置 CORS 示例
add_header Access-Control-Allow-Origin "https://your-frontend-domain.com";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type, Authorization";
```
:::

## 2. 刷新子页面后出现 404

::: danger 最常见错误
这是 Vue Router History 模式的经典问题，**所有 Vue 单页应用部署都可能遇到**。
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

同时确认 `env.js` 中的 `window.routerBase` 与 Nginx 路径一致。

::: tip 配置生效提醒
在 aaPanel 中修改 Nginx 配置后，需要点击 **保存** 按钮。aaPanel 会自动重载 Nginx 配置，无需手动执行 `nginx -s reload`。
:::

## 3. 修改 env.js 后配置未生效

**原因**：浏览器缓存或 Nginx 缓存导致旧配置被使用。

**解决方法**：

1. 在 aaPanel 文件管理器中确认修改已保存
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

## 4. aaPanel 中修改 Nginx 配置文件后网站无法访问

**原因**：Nginx 配置文件语法错误。

**解决方法**：

- aaPanel 会在保存配置时检查语法，如果报错会提示具体行号
- 常见错误：花括号不匹配、缺少分号、`server_name` 重复

::: tip 备份恢复
使用 aaPanel 的 **网站** → **设置** → **配置文件** 中的 **备份** 功能，出错后可快速恢复。
:::

## 5. 部署后落地页样式丢失或白屏

**原因**：资源文件缺失或路径配置错误。

**解决方法**：

1. 确认 `dist/` 目录中所有文件已上传，特别是 `assets/` 子目录
2. 检查浏览器控制台是否有 404 资源加载错误
3. 子目录部署时确认 `env.js` 中 `assets_path` 配置正确（如 `/stellar/assets`）

::: details 检查资源加载
打开浏览器开发者工具 → Network 面板，刷新页面，筛选 CSS/JS 类型的请求，查看是否有红色标记的 404 请求。这些就是加载失败的资源。
:::

## 6. 想关闭落地页，直接跳转登录页

**原因**：默认开启了落地页功能。

**解决方法**：

将 `env.js` 中的 `landing_page_enabled` 设置为 `false`：

```js
window.landing_page_enabled = false;
```

刷新页面后，访问首页会自动跳转到登录页（未登录时）或仪表盘（已登录时）。

---

::: tip 需要更多帮助？
如果以上方法无法解决您的问题，请提供具体的错误描述和截图，我们会尽快协助您排查。
:::
