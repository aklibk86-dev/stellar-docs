// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

// ----- 右侧大纲上方的卡片组（相关推荐） -----
const AsideCards = {
  setup() {
    return () =>
      h('div', { class: 'aside-card-group' }, [
        h('div', { class: 'custom-aside-card' }, [
          h('h4', [
            h('i', { 
              class: 'fas fa-book-open', 
              style: 'margin-right: 8px; color: #fbbf24;' // 金色
            }),
            '相关推荐'
          ]),
          h('ul', { style: 'padding-left: 0; list-style: none;' }, [
            h('li', {
              style: 'display: flex; align-items: center; margin: 6px 0;'
            }, [
              h('i', { 
                class: 'fab fa-docker', 
                style: 'margin-right: 8px; width: 1.2em; text-align: center; color: #2496ED;' // Docker 蓝
              }),
              h('a', { href: '/install/vercel' }, 'Vercel 部署指南')
            ]),
            h('li', {
              style: 'display: flex; align-items: center; margin: 6px 0;'
            }, [
              h('i', { 
                class: 'fab fa-github', 
                style: 'margin-right: 8px; width: 1.2em; text-align: center; color: #f0f0f0;' // 浅灰（适配深色背景）
              }),
              h('a', { href: '/install/agithub' }, 'GitHub Pages 部署指南')
            ]),
            h('li', {
              style: 'display: flex; align-items: center; margin: 6px 0;'
            }, [
              h('i', { 
                class: 'fab fa-cloudflare', 
                style: 'margin-right: 8px; width: 1.2em; text-align: center; color: #F38020;' // Cloudflare 橙
              }),
              h('a', { href: '/install/cloudflar' }, 'Cloudflare Pages 部署指南')
            ]),
            h('li', {
              style: 'display: flex; align-items: center; margin: 6px 0;'
            }, [
              h('i', { 
                class: 'fas fa-cog', 
                style: 'margin-right: 8px; width: 1.2em; text-align: center; color: #94a3b8;' // 银灰色
              }),
              h('a', { href: 'https://config.aklibk.wiki/' }, '配置文件生成')
            ]),
          ]),
        ]),
      ])
  },
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 右侧大纲上方
      'aside-outline-before': () => h(AsideCards),
    })
  },
}