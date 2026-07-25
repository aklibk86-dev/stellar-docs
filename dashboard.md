# Stellar Theme

[![GitHub](https://img.shields.io/badge/GitHub-aklibk86--dev%2Fstellar-181717?logo=github)](https://github.com/aklibk86-dev/stellar)

Stellar Theme 是一套面向 XBoard 的现代化用户端主题，基于 Vue 3、TypeScript 与 Vite 构建，覆盖落地页、认证、套餐购买、订单、工单、邀请、知识库、流量统计、订阅导入和个人资料等完整功能。

支持中英文切换、深浅色主题、响应式布局、多 API 可用性检测、运行时配置、子目录部署及 CDN 静态资源加速。大部分站点信息和 API 设置均可通过 `public/env.js` 修改，无需重新构建。

兼容两类后端：
- **cedar2025/Xboard**：支持魔法链接登录、礼品卡、Turnstile/reCAPTCHA v3
- **wyx2685/v2board**：支持工单提现、流量提前重置、解绑 Telegram

## 功能

| 功能模块 | 说明 |
| --- | --- |
| 官网落地页 | 品牌导航、核心卖点、线路展示、套餐列表、FAQ |
| 用户认证 | 用户名/邮箱登录、注册、邮箱验证码登录、忘记密码 |
| 用户仪表盘 | 账户概况、有效期、剩余流量、订阅导入、待处理提醒 |
| 订阅导入 | 多平台客户端资源与下载链接配置 |
| 节点与服务器 | 查看后端返回的可用节点信息 |
| 套餐购买 | 从后端读取套餐、选择支付方式、提交订单 |
| 订单管理 | 查看历史订单和状态 |
| 工单系统 | 提交工单、查看状态 |
| 邀请与返利 | 邀请链接、记录及佣金数据 |
| 知识库 | 帮助文章加载，支持 HTML/Markdown 混排 |
| 流量统计 | ECharts 图表展示流量使用趋势 |
| 个人资料 | 基础资料、密码和账户相关设置 |
| API 可用性检测 | 多地址并行检测，自动选择可用 API |

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Vue 3 | 前端应用框架 |
| TypeScript | 静态类型检查 |
| Vite | 开发服务器与构建 |
| Vue Router | 前端路由 |
| Pinia | 状态管理 |
| Naive UI | UI 组件库 |
| Axios | HTTP 请求 |
| Vue I18n | 国际化 |
| ECharts / Vue ECharts | 图表展示 |
| Tailwind CSS / PostCSS / Sass | 样式工具链 |
| DOMPurify | HTML 内容安全净化 |

## 环境要求

- Node.js 20 LTS+
- npm 10+
- 可正常访问的 XBoard 后端 API

## 快速开始

### 1. 获取项目

```bash
git clone https://github.com/aklibk86-dev/stellar.git
cd stellar
```

### 2. 安装依赖

```bash
npm ci
```

### 3. 配置开发 API

复制环境变量模板：

```bat
copy .env.example .env.development
```

修改 `.env.development`：

```env
VITE_DEV_API_TARGET=https://api.example.com
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问：`http://localhost:3100`

### 5. 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录。

### 6. 预览生产版本

```bash
npm run preview
```

## 部署方式

选择适合你的部署方案：

| 部署方式 | 说明 |
| --- | --- |
| [aaPanel](/install/aapanel) | 面板一键部署，适合服务器环境 |
| [Vercel](/install/vercel) | 免费静态托管，自动构建 |
| [Cloudflare Pages](/install/cloudflare) | 免费静态托管，全球边缘网络 |

## 配置说明

详细配置项请参考 [配置文件详解](/config/config)。

## 故障排查

遇到问题请参考 [常见问题](/troubleshooting/faq)。

## 项目地址

- GitHub：<https://github.com/aklibk86-dev/stellar>
- Telegram：<https://t.me/kqxw_chat>
