// .vitepress/config.ts
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Stellar Theme",
  description: "基于Xboard的前后分离的开源主题。",
  ignoreDeadLinks: true,

  // ===== 新增 head 配置：加载 Font Awesome 图标库 =====
  head: [
    // 引入 Font Awesome 6 免费版 CSS（用于替换 Emoji 图标）
    ['link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css' }],
    // 如果您还需要其他 meta 标签或脚本，可以在此添加
    // 例如：['meta', { name: 'theme-color', content: '#3b82f6' }],
  ],

  themeConfig: {
    logo: '/img/logo.svg',

    // 本地搜索配置
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索'
          },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除搜索条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    nav: [
      { text: '首页', link: '/' },
      { text: '项目预览', link: '/output' },
      { text: '演示站点', link: 'https://demo-Stellar.aklibk.com' },
      { text: '配置文件生成', link: 'https://config.aklibk.wiki/' },
      { 
        component: 'VersionSelector' // 自定义组件（需在主题中注册）
      }
    ],

    sidebar: [
      {
        text: '安装手册',
        items: [
          { text: '项目介绍', link: '/dashboard' },
          { text: 'docker安装教程', link: '/install/docker' },
          { text: 'aapanel安装教程', link: '/install/aapanel' },
          { text: '1panel安装教程', link: '/install/1panel' },
        ]
      },
      {
        text: '静态托管',
        items: [
          { text: 'Vercel 部署指南', link: '/install/vercel' },
          { text: 'github Pages部署指南', link: '/install/github' },
          { text: 'cloudflare Pages部署指南', link: '/install/cloudflare' }
        ]
      },
      {
        text: '配置文件详解',
        items: [
          { text: 'config配置详解', link: '/config/config' }
        ]
      },
      {
        text: '故障排查',
        items: [
          { text: 'docker安装问题', link: '/troubleshooting/docker' },
          { text: 'aapanel安装问题', link: '/troubleshooting/aapanelfaq' },
          { text: '1panel安装问题', link: '/troubleshooting/1panel' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aklibk86-dev/stellar' },
      { icon: 'telegram', link: 'https://t.me/kqxw_chat' }
    ]
  }
})