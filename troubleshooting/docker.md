# Docker 常见问题

::: tip 排查思路
遇到问题建议按照以下顺序排查：检查容器日志 → 检查 `env.js` 配置 → 检查 Nginx 代理规则 → 检查后端服务状态。
:::

## API 请求 404

**原因**：API 代理路径配置错误。

**解决方法**：

1. 检查 [`env.js`](public/env.js) 中的 `api` 配置是否正确
2. 检查 Docker Compose 或 Nginx 代理规则中的路径是否匹配
3. 确保后端服务已正确启动

::: warning 提示
如果使用 Docker Compose，请检查 `docker-compose.yml` 中 API 服务的网络连接是否正常，确保前端容器能够访问后端容器。
:::

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

## Logo 不显示

**原因**：Logo 路径错误或文件未挂载到容器中。

**解决方法**：

1. 检查 `env.js` 中 `logo` 配置的路径是否正确
2. 如果使用 Docker，确认 volume 挂载路径是否正确
3. 检查 Logo 文件是否存在于指定路径
4. 清除浏览器缓存后重新加载

## 刷新页面 404

::: danger 常见错误
这是 Vue Router History 模式部署中最常见的错误。Nginx 未正确配置单页应用回退规则。
:::

**原因**：Nginx 未配置 History 模式回退。

**解决方法**：

在 Nginx 配置中添加 `try_files` 回退规则：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

::: tip 子目录部署注意
如果是子目录部署，需要将回退路径改为对应的子目录路径：

```nginx
location /stellar/ {
    try_files $uri $uri/ /stellar/index.html;
}
```
:::

## 时区不对

**原因**：Docker 容器未正确设置时区。

**解决方法**：

在 Docker Compose 或 Docker Run 命令中设置时区环境变量：

```yaml
environment:
  - TZ=Asia/Shanghai
```

::: info 支持的时区格式
时区格式为 `地区/城市`，例如：
- `Asia/Shanghai`（中国标准时间）
- `Asia/Tokyo`（日本标准时间）
- `America/New_York`（美国东部时间）

完整的时区列表可以参考 [IANA Time Zone Database](https://www.iana.org/time-zones)。
:::

## 容器无法启动

**原因**：端口冲突、配置错误或镜像问题。

**解决方法**：

1. 使用 `docker logs <容器名>` 查看容器启动日志
2. 检查端口是否被占用：`netstat -tulpn | grep <端口号>`
3. 确认 Docker 镜像已正确构建或拉取
4. 检查 Docker Compose 文件语法是否正确

```bash
# 查看容器日志
docker logs stellar-frontend

# 检查端口占用
netstat -tulpn | grep 80
```

## 构建镜像失败

**原因**：构建环境问题或依赖安装失败。

**解决方法**：

1. 检查网络连接，确认能正常访问 npm 仓库
2. 清除 npm 缓存：`npm cache clean --force`
3. 确认 Node.js 版本符合项目要求（推荐 v18+）
4. 检查 Dockerfile 中的构建步骤是否正确

---

::: tip 需要更多帮助？
如果以上方法无法解决您的问题，请提供详细的错误信息和容器日志，我们会尽快协助您排查。
:::
