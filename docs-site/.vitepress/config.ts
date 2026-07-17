import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'AI-Native 前端框架',
  description: '让你自己的前端应用，获得高准确率、可见可控的 AI 操作能力',
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/why' },
      { text: 'API', link: '/api/core' },
      { text: 'Playground', link: '/playground' },
      { text: 'RFC', link: 'https://github.com/FantasticPerson/ai-native-framework/blob/main/docs/rfcs/0001-ai-native-frontend-framework.md' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '为什么做', link: '/guide/why' },
            { text: '快速开始', link: '/guide/getting-started' },
          ],
        },
        {
          text: '核心概念',
          items: [
            { text: '接入光谱', link: '/guide/access-spectrum' },
            { text: '执行反馈闭环', link: '/guide/feedback-loop' },
            { text: '安全模型', link: '/guide/security' },
          ],
        },
      ],
      '/api/': [
        {
          text: '包 API',
          items: [
            { text: '@ai-native/core', link: '/api/core' },
            { text: '@ai-native/scanner', link: '/api/scanner' },
            { text: '@ai-native/react', link: '/api/react' },
            { text: '@ai-native/vue', link: '/api/vue' },
            { text: 'preset-react-router', link: '/api/preset-react-router' },
            { text: 'preset-antd', link: '/api/preset-antd' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/FantasticPerson/ai-native-framework' },
    ],
    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright © 2026 FantasticPerson',
    },
  },
});
