# AI-Native 前端框架

> 简体中文 | [English](README.en.md) · [📖 在线文档](https://ai-native-framework.pages.dev/)

> 让你自己的前端应用，获得高准确率、可见可控的 AI 操作能力。

用户对着应用说一句话（「帮我提个明天的事假」「把报销按差旅筛选」），AI 自动完成对应的多步操作——切页、填表、点击、提交——并且全程**看得见**：虚拟光标移动、逐字填写、目标高亮，用户能看懂、能信任、能随时中断。

一句话区分竞品：**别人让 AI「看屏幕猜着操作任意网站」，我们让 AI「读结构精确操作你自己的应用」。**

## 核心洞察

现代前端应用的语义早已存在，只是散落各处、从未被收集——页面在路由里、字段在 `<Form.Item>` 里、操作在带文案的按钮上。本框架的核心动作是：**在构建时用 AST 静态分析，从代码已有的结构中提取「能力清单」（manifest）**，让 LLM 在编译期确定的能力白名单里精确编排操作。标注是可选的增强手段，不是接入的前提。

## 接入光谱：低地板 + 高天花板

不二选一，按需组合：

1. **自动推断（零改动）**——preset 扫路由得模块、扫 `<Form.Item>` 得字段。
2. **配置补漏**——`ai.config` 补自动推断够不到的地方。
3. **手动精标**——`data-ai-*` 属性精确标注，准确率最高。

> 诚实的边界：自动推断准确率 < 手动标注，是物理规律。我们不宣称「全自动且最准」。

## 包一览

| 包 | 做什么 | 依赖 |
|---|---|---|
| `@ai-operable/core` | 框架无关运行时：能力清单类型、LLM 输出解析与白名单校验、执行器、执行反馈闭环、provider | 无前端框架 |
| `@ai-operable/scanner` | 构建时 AST 扫描（JSX + Vue SFC）+ Vite 插件，生成 manifest | core |
| `@ai-operable/react` | React 适配器：受控组件填值、`useAIAgent` hook、`AIBar` | core |
| `@ai-operable/vue` | Vue 适配器：原生填值、`useAIAgent` composable、`AIBar` | core |
| `@ai-operable/preset-react-router` | 自动推断第一层：扫路由得模块清单 | scanner |
| `@ai-operable/preset-antd` | 自动推断第二层：扫 antd 表单得字段清单 + 运行时字段适配 | scanner |

`core` 不认识任何前端框架，只认识「能力清单 + adapter 接口」。React 与 Vue 两个 adapter 并存、跑通同一套 core，即是内核真解耦的反证。

## 快速开始

本仓库是 pnpm monorepo。

```bash
pnpm install          # 安装依赖
pnpm -r build         # 按依赖序构建全部包
pnpm -r test          # 运行全部单测

# 跑示例（需自备 LLM key，走服务端代理，key 不进前端）
pnpm --filter ai-native-demo dev   # React + antd 全功能示例
pnpm --filter vue-demo dev         # Vue 最小示例（反证 core 框架无关）
```

## 文档与设计

- 设计与定位：[`docs/rfcs/0001-ai-native-frontend-framework.md`](docs/rfcs/0001-ai-native-frontend-framework.md)
- 进度：[`ROADMAP.md`](ROADMAP.md)
- 贡献指南：[`CONTRIBUTING.md`](CONTRIBUTING.md)
- 文档站：<https://ai-native-framework.pages.dev/>（在线，VitePress）；本地预览 `pnpm --filter docs-site dev`

## 状态

阶段 0-3 已完成（RFC → React 库 → 内核去框架化 → Vue 反证解耦）。当前处于阶段 4（文档站 + 治理 + 发布准备）。**尚未发布到 npm**，API 处于 0.x，可能变动。

## 许可

[MIT](LICENSE) © FantasticPerson
