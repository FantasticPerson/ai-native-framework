import { defineConfig } from 'vitepress';

const RFC_URL =
  'https://github.com/FantasticPerson/ai-native-framework/blob/main/docs/rfcs/0001-ai-native-frontend-framework.md';
const REPO_URL = 'https://github.com/FantasticPerson/ai-native-framework';

export default defineConfig({
  // 中文留根，英文进 /en/；右上角自动渲染语言切换下拉
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'AI-Native 前端框架',
      description: '让你自己的前端应用，获得高准确率、可见可控的 AI 操作能力',
      themeConfig: {
        nav: [
          { text: '指南', link: '/guide/why' },
          { text: 'API', link: '/api/core' },
          { text: 'Playground', link: '/playground' },
          { text: 'RFC', link: RFC_URL },
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
        footer: {
          message: 'MIT Licensed',
          copyright: 'Copyright © 2026 FantasticPerson',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'AI-Native Frontend Framework',
      description:
        'Give your own frontend app high-accuracy, visible and controllable AI operations',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/why' },
          { text: 'API', link: '/en/api/core' },
          { text: 'Playground', link: '/en/playground' },
          { text: 'RFC', link: RFC_URL },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Why', link: '/en/guide/why' },
                { text: 'Quick Start', link: '/en/guide/getting-started' },
              ],
            },
            {
              text: 'Core Concepts',
              items: [
                { text: 'Access Spectrum', link: '/en/guide/access-spectrum' },
                { text: 'Execution Feedback Loop', link: '/en/guide/feedback-loop' },
                { text: 'Security Model', link: '/en/guide/security' },
              ],
            },
          ],
          '/en/api/': [
            {
              text: 'Package API',
              items: [
                { text: '@ai-native/core', link: '/en/api/core' },
                { text: '@ai-native/scanner', link: '/en/api/scanner' },
                { text: '@ai-native/react', link: '/en/api/react' },
                { text: '@ai-native/vue', link: '/en/api/vue' },
                { text: 'preset-react-router', link: '/en/api/preset-react-router' },
                { text: 'preset-antd', link: '/en/api/preset-antd' },
              ],
            },
          ],
        },
        footer: {
          message: 'MIT Licensed',
          copyright: 'Copyright © 2026 FantasticPerson',
        },
      },
    },
  },
  themeConfig: {
    socialLinks: [{ icon: 'github', link: REPO_URL }],
  },
});
