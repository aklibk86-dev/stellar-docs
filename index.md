---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  logo: '/img/logo.svg'
  name: "Stellar Theme"
  text: "基于Xboard的前后分离的开源主题。"
  actions:
    - theme: brand
      text: Github
      link: https://github.com/aklibk86-dev/stellar
    - theme: alt
      text: 开始使用→
      link: /dashboard

features:
  - title: 一体化落地页与用户中心
    details: 将官网营销落地页和完整用户控制台整合在同一个单页应用中，未登录用户可浏览产品展示与套餐，登录后自动切换至带侧边栏的控制台，覆盖从品牌展示到订阅管理的完整使用流程。
  - title: 运行时配置无需重复构建
    details: 站点标题、Logo、背景图、Telegram 链接、客户端下载地址和 API 接入方式等全部集中在 public/env.js 中管理，部署后可直接编辑服务器上的配置文件并刷新页面生效，不必每次修改品牌信息都重新编译前端。
  - title: 灵活的 API 接入方案
    details: 支持单地址直连、多地址自动检测与健康检查、同域名反向代理、自定义代理转发等多种接入方式，适配同域部署、跨域部署、CDN 静态托管等不同架构，同时内置 API 不可用时展示联系信息的降级处理。

---

